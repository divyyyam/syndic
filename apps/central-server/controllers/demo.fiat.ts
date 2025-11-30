//@ts-nocheck
import { Request,Response } from "express";
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import { z } from 'zod';
import bs58 from 'bs58';

const prisma = new PrismaClient();

 
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

 
const solanaConnection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

const getWalletKeypair = (): Keypair => {
  const privateKeyString = process.env.SOLANA_PRIVATE_KEY!;
  const privateKeyArray = bs58.decode(privateKeyString);
  return Keypair.fromSecretKey(privateKeyArray);
};

// Validation schemas
const createDemoTransactionSchema = z.object({
  amountINR: z.number().positive().max(100000), // Max 1 lakh for demo
  receiverWalletAddress: z.string().min(32).max(44), // Solana address
  tokenType: z.enum(['SOL', 'USDC', 'USDT']).default('USDC'),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

 
export const createDemoTransaction = async (req: Request, res: Response) => {
  try {
    const userId ='demo-user';
    const { amountINR, receiverWalletAddress, tokenType } = createDemoTransactionSchema.parse(req.body);

    
    try {
      new PublicKey(receiverWalletAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Solana wallet address',
      });
    }

    // Convert INR to crypto based on current rates (simplified for demo)
    const conversionRates = {
      SOL: 11000, // 1 SOL = 11,000 INR (example)
      USDC: 83.5, // 1 USDC = 83.5 INR
      USDT: 83.5, // 1 USDT = 83.5 INR
    };

    const amountCrypto = amountINR / conversionRates[tokenType];
    const feesINR = amountINR * 0.02; // 2% platform fee
    const totalINR = amountINR + feesINR;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalINR * 100), // Amount in paise
      currency: 'INR',
      receipt: `demo_tx_${Date.now()}`,
      notes: {
        userId,
        receiverWallet: receiverWalletAddress,
        tokenType,
        amountCrypto: amountCrypto.toFixed(6),
      },
    });

    // Create transaction record in database
    const transaction = await prisma.transaction.create({
      data: {
        senderId: userId,
        receiverDetails: {
          walletAddress: receiverWalletAddress,
          type: 'demo',
        },
        fromAmount: totalINR,
        fromCurrency: 'INR',
        toAmount: amountCrypto,
        toCurrency: tokenType,
        toCountry: 'SOLANA',
        selectedRoute: 'DEMO_RAZORPAY_SOLANA',
        status: 'INITIATED',
        fees: {
          networkFee: 0.005, // Solana network fee
          providerFee: feesINR,
          fxFee: 0,
          platformFee: feesINR,
          totalFees: feesINR,
        },
        providerTxId: razorpayOrder.id,
      },
    });
    await prisma.transactionStep.create({
      data: {
        transactionId: transaction.id,
        stepOrder: 1,
        stepType: 'PAYMENT_INITIATION',
        provider: 'razorpay',
        status: 'PENDING',
        stepData: {
          orderId: razorpayOrder.id,
          amount: totalINR,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        transactionId: transaction.id,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        conversionDetails: {
          amountINR,
          feesINR,
          totalINR,
          amountCrypto: amountCrypto.toFixed(6),
          tokenType,
          exchangeRate: conversionRates[tokenType],
        },
        receiverWallet: receiverWalletAddress,
      },
      message: 'Demo transaction created. Complete payment to trigger Solana transfer.',
    });

  } catch (error) {
    console.error('Create demo transaction error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create demo transaction',
    });
  }
};

 
export const verifyAndExecuteTransfer = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentSchema.parse(req.body);

    // Step 1: Verify Razorpay signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.',
      });
    }

    // Step 2: Get transaction from database
    const transaction = await prisma.transaction.findFirst({
      where: {
        providerTxId: razorpay_order_id,
        status: 'INITIATED',
      },
      include: {
        executionSteps: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed',
      });
    }

    // Step 3: Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'PAYMENT_PROCESSING',
        providerStatus: 'PAYMENT_CONFIRMED',
      },
    });

    // Update payment step
    await prisma.transactionStep.updateMany({
      where: {
        transactionId: transaction.id,
        stepType: 'PAYMENT_INITIATION',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        stepData: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          verifiedAt: new Date(),
        },
      },
    });

    // Step 4: Execute Solana transfer
    const transferResult = await executeSolanaTransfer(transaction);

    if (transferResult.success) {
      // Mark transaction as completed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          solanaSignature: transferResult.signature,
          completedAt: new Date(),
        },
      });

      // Create completion step
      await prisma.transactionStep.create({
        data: {
          transactionId: transaction.id,
          stepOrder: 2,
          stepType: 'BLOCKCHAIN_SWAP',
          provider: 'solana',
          status: 'COMPLETED',
          startedAt: new Date(),
          completedAt: new Date(),
          stepData: {
            signature: transferResult.signature,
            fromWallet: transferResult.fromWallet,
            toWallet: transferResult.toWallet,
            amount: transferResult.amount,
            tokenType: transaction.toCurrency,
          },
        },
      });

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          status: 'COMPLETED',
          razorpay: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            status: 'captured',
          },
          solana: {
            signature: transferResult.signature,
            amount: transaction.toAmount,
            token: transaction.toCurrency,
            receiverWallet: transaction.receiverDetails.walletAddress,
            explorerUrl: `https://solscan.io/tx/${transferResult.signature}`,
          },
        },
        message: 'Payment verified and crypto transferred successfully!',
      });

    } else {
      // Transfer failed, mark transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failureReason: transferResult.error,
        },
      });

      res.status(500).json({
        success: false,
        message: `Payment verified but crypto transfer failed: ${transferResult.error}`,
        data: {
          transactionId: transaction.id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });
    }

  } catch (error) {
    console.error('Verify and execute transfer error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to verify and execute transfer',
    });
  }
};

/**
 * Step 3: Get Demo Transaction Status
 */
export const getDemoTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        executionSteps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        status: transaction.status,
        payment: {
          amountINR: transaction.fromAmount,
          currency: transaction.fromCurrency,
          razorpayOrderId: transaction.providerTxId,
          razorpayStatus: transaction.providerStatus,
        },
        transfer: {
          amount: transaction.toAmount,
          token: transaction.toCurrency,
          receiverWallet: transaction.receiverDetails.walletAddress,
          signature: transaction.solanaSignature,
          explorerUrl: transaction.solanaSignature 
            ? `https://solscan.io/tx/${transaction.solanaSignature}`
            : null,
        },
        fees: transaction.fees,
        timeline: transaction.executionSteps.map(step => ({
          step: step.stepType,
          status: step.status,
          provider: step.provider,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
        })),
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });

  } catch (error) {
    console.error('Get demo transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction status',
    });
  }
};

/**
 * Webhook: Razorpay Payment Callback
 * Razorpay calls this automatically when payment succeeds
 */
export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = req.body;

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find transaction
      const transaction = await prisma.transaction.findFirst({
        where: { providerTxId: orderId },
      });

      if (transaction && transaction.status === 'INITIATED') {
        // Auto-execute transfer
        const transferResult = await executeSolanaTransfer(transaction);

        if (transferResult.success) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              solanaSignature: transferResult.signature,
              completedAt: new Date(),
            },
          });

          console.log(`✅ Webhook: Transaction ${transaction.id} completed automatically`);
        }
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ success: false });
  }
};

 
const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const text = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(text)
    .digest('hex');

  return expectedSignature === signature;
};

 
const executeSolanaTransfer = async (transaction: any): Promise<any> => {
  try {
    const walletKeypair = getWalletKeypair();
    const receiverPublicKey = new PublicKey(transaction.receiverDetails.walletAddress);
    const tokenType = transaction.toCurrency;
    const amount = transaction.toAmount;

    console.log(`🚀 Executing Solana transfer: ${amount} ${tokenType} to ${receiverPublicKey.toBase58()}`);

    if (tokenType === 'SOL') {
      
      const lamports = amount * LAMPORTS_PER_SOL;
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: walletKeypair.publicKey,
        toPubkey: receiverPublicKey,
        lamports: Math.floor(lamports),
      });

      const transaction = new Transaction().add(transferInstruction);
      
      const signature = await sendAndConfirmTransaction(
        solanaConnection,
        transaction,
        [walletKeypair],
        {
          commitment: 'confirmed',
        }
      );

      console.log(`✅ SOL transfer successful: ${signature}`);

      return {
        success: true,
        signature,
        fromWallet: walletKeypair.publicKey.toBase58(),
        toWallet: receiverPublicKey.toBase58(),
        amount,
      };

    } else {
      // Transfer SPL tokens (USDC, USDT, etc.)
      const tokenMintAddress = getTokenMintAddress(tokenType);
      const tokenMint = new PublicKey(tokenMintAddress);

      // Get token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        walletKeypair.publicKey
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        receiverPublicKey
      );

      // Check if receiver token account exists
      try {
        await getAccount(solanaConnection, toTokenAccount);
      } catch (error) {
        return {
          success: false,
          error: 'Receiver token account does not exist. They need to create it first.',
        };
      }

      // Calculate amount with decimals (USDC/USDT use 6 decimals)
      const decimals = 6;
      const transferAmount = Math.floor(amount * Math.pow(10, decimals));

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        walletKeypair.publicKey,
        transferAmount,
        [],
        TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(transferInstruction);

      const signature = await sendAndConfirmTransaction(
        solanaConnection,
        transaction,
        [walletKeypair],
        {
          commitment: 'confirmed',
        }
      );

      console.log(`✅ ${tokenType} transfer successful: ${signature}`);

      return {
        success: true,
        signature,
        fromWallet: walletKeypair.publicKey.toBase58(),
        toWallet: receiverPublicKey.toBase58(),
        amount,
      };
    }

  } catch (error) {
    console.error('❌ Solana transfer failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get token mint address for currency
 */
const getTokenMintAddress = (currency: string): string => {
  const tokenMap: Record<string, string> = {
    'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  };

  return tokenMap[currency];
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const walletKeypair = getWalletKeypair();
    const publicKey = walletKeypair.publicKey;

    // Get SOL balance
    const solBalance = await solanaConnection.getBalance(publicKey);
    const solBalanceReadable = solBalance / LAMPORTS_PER_SOL;

    // Get USDC balance
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const usdcTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
    
    let usdcBalance = 0;
    try {
      const usdcAccount = await getAccount(solanaConnection, usdcTokenAccount);
      usdcBalance = Number(usdcAccount.amount) / Math.pow(10, 6);
    } catch (error) {
      console.log('USDC account not found');
    }

    // Get USDT balance
    const usdtMint = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
    const usdtTokenAccount = await getAssociatedTokenAddress(usdtMint, publicKey);
    
    let usdtBalance = 0;
    try {
      const usdtAccount = await getAccount(solanaConnection, usdtTokenAccount);
      usdtBalance = Number(usdtAccount.amount) / Math.pow(10, 6);
    } catch (error) {
      console.log('USDT account not found');
    }

    res.json({
      success: true,
      data: {
        walletAddress: publicKey.toBase58(),
        balances: {
          SOL: solBalanceReadable.toFixed(4),
          USDC: usdcBalance.toFixed(2),
          USDT: usdtBalance.toFixed(2),
        },
      },
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
    });
  }
};