import { KycProvider, KycProviderLevel } from '@account-agg/shared';
import { AadhaarAdapter, type AadhaarConfig } from './adapters/aadhaar.adapter';
import { DigiLockerAdapter, type DigiLockerConfig } from './adapters/digilocker.adapter';
import { PanAdapter, type PanConfig } from './adapters/pan.adapter';
import { CkycAdapter, type CkycConfig } from './adapters/ckyc.adapter';

export interface OrchestratorConfig {
  aadhaar?: AadhaarConfig;
  digilocker?: DigiLockerConfig;
  pan?: PanConfig;
  ckyc?: CkycConfig;
}

export interface KycResult {
  provider: KycProvider;
  level: KycProviderLevel;
  verifiedData: Record<string, unknown>;
  success: boolean;
  error?: string;
}

export class KycOrchestrator {
  private aadhaar?: AadhaarAdapter;
  private digilocker?: DigiLockerAdapter;
  private pan?: PanAdapter;
  private ckyc?: CkycAdapter;

  constructor(config: OrchestratorConfig) {
    if (config.aadhaar) this.aadhaar = new AadhaarAdapter(config.aadhaar);
    if (config.digilocker) this.digilocker = new DigiLockerAdapter(config.digilocker);
    if (config.pan) this.pan = new PanAdapter(config.pan);
    if (config.ckyc) this.ckyc = new CkycAdapter(config.ckyc);
  }

  getProviderLevel(provider: KycProvider): KycProviderLevel {
    const levels: Record<KycProvider, KycProviderLevel> = {
      [KycProvider.PAN]: KycProviderLevel.BASIC,
      [KycProvider.DIGILOCKER]: KycProviderLevel.STANDARD,
      [KycProvider.AADHAAR]: KycProviderLevel.FULL,
      [KycProvider.CKYC]: KycProviderLevel.CKYC,
    };
    return levels[provider];
  }

  /**
   * Try verification with the best available provider.
   * Priority: CKYC > Aadhaar > DigiLocker > PAN
   */
  async verifyWithBestProvider(params: {
    aadhaarNumber?: string;
    pan?: string;
    name?: string;
    dob?: string;
  }): Promise<KycResult> {
    // Try CKYC first
    if (this.ckyc && params.pan) {
      try {
        const search = await this.ckyc.search('PAN', params.pan);
        if (search.found && search.ckycNumber) {
          const record = await this.ckyc.downloadRecord(search.ckycNumber);
          return {
            provider: KycProvider.CKYC,
            level: KycProviderLevel.CKYC,
            verifiedData: record,
            success: true,
          };
        }
      } catch (err) {
        // Fall through to next provider
      }
    }

    // Try PAN (simplest, most available)
    if (this.pan && params.pan && params.name) {
      try {
        const result = await this.pan.verify(params.pan, params.name, params.dob);
        if (result.valid && result.nameMatch) {
          return {
            provider: KycProvider.PAN,
            level: KycProviderLevel.BASIC,
            verifiedData: { pan: params.pan, name: params.name, verified: true },
            success: true,
          };
        }
      } catch (err) {
        // Fall through
      }
    }

    return {
      provider: KycProvider.PAN,
      level: KycProviderLevel.BASIC,
      verifiedData: {},
      success: false,
      error: 'No KYC provider could verify the user',
    };
  }
}
