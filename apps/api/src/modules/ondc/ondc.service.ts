import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { randomUUID } from 'node:crypto';
import type { BecknContext } from '@account-agg/shared';
import { OndcDomain, OndcAction } from '@account-agg/shared';

@Injectable()
export class OndcService {
  private readonly bapId: string;
  private readonly bapUri: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.bapId = this.config.get('ONDC_BAP_ID', 'account-agg-bap');
    this.bapUri = this.config.get('ONDC_BAP_URI', 'http://localhost:3001/api/ondc');
  }

  /**
   * Search for financial products (loans, insurance, MF) on ONDC network.
   */
  async searchProducts(category: string, params: Record<string, unknown>) {
    const context = this.buildContext(OndcAction.SEARCH);

    const searchPayload = {
      context,
      message: {
        intent: {
          category: { id: category },
          ...params,
        },
      },
    };

    // In production: POST to ONDC gateway
    // For now, return simulated catalog
    return {
      context,
      message: {
        catalog: {
          providers: [
            {
              id: 'sandbox-bank-01',
              descriptor: { name: 'Sandbox Bank' },
              items: [
                {
                  id: 'pl-001',
                  descriptor: {
                    name: 'Personal Loan',
                    short_desc: 'Quick personal loan up to 10L',
                  },
                  category_id: 'PERSONAL_LOAN',
                  price: { currency: 'INR', value: '500000' },
                  tags: [
                    {
                      descriptor: { name: 'Interest Rate' },
                      list: [{ descriptor: { name: 'rate' }, value: '10.5%' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };
  }

  /**
   * Initialize order with ZK proofs attached.
   */
  async initOrder(
    productId: string,
    providerId: string,
    proofIds: string[],
    userId: string,
  ) {
    // Fetch user's verified proofs
    const proofs = await this.prisma.proof.findMany({
      where: {
        id: { in: proofIds },
        userId,
        verified: true,
      },
      select: {
        circuitType: true,
        publicInputs: true,
        proofHash: true,
      },
    });

    const context = this.buildContext(OndcAction.INIT);

    return {
      context,
      message: {
        order: {
          provider: { id: providerId },
          items: [{ id: productId }],
          fulfillments: [
            {
              customer: { person: { id: userId } },
            },
          ],
          // Attach ZK proofs as verifiable credentials
          tags: [
            {
              descriptor: { name: 'ZK_PROOFS' },
              list: proofs.map((p) => ({
                descriptor: { name: p.circuitType },
                value: JSON.stringify({
                  proofHash: p.proofHash,
                  publicInputs: p.publicInputs,
                  verifyEndpoint: `${this.bapUri}/verify/proof`,
                }),
              })),
            },
          ],
        },
      },
    };
  }

  /**
   * Handle callback from BPP (provider).
   */
  async handleCallback(action: string, payload: unknown) {
    // Log callback for audit
    await this.prisma.auditLog.create({
      data: {
        action: `ondc_callback_${action}`,
        resource: 'OndcModule',
        metadata: payload as any,
      },
    });

    return { message: { ack: { status: 'ACK' } } };
  }

  private buildContext(action: OndcAction): BecknContext {
    return {
      domain: OndcDomain.FINANCIAL_SERVICES,
      action,
      bap_id: this.bapId,
      bap_uri: this.bapUri,
      transaction_id: randomUUID(),
      message_id: randomUUID(),
      timestamp: new Date().toISOString(),
      country: 'IND',
      city: 'std:080',
    };
  }
}
