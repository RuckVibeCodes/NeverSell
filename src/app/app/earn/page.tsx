'use client';

import { useState } from 'react';
import { VaultDiscovery } from '@/components/earn/VaultDiscovery';
import { DepositModal } from '@/components/earn/DepositModal';
import type { BeefyVaultWithStats } from '@/lib/beefy';

export default function EarnPage() {
  const [selectedVault, setSelectedVault] = useState<BeefyVaultWithStats | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const handleDepositClick = (vault: BeefyVaultWithStats) => {
    setSelectedVault(vault);
    setShowDepositModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <VaultDiscovery onDepositClick={handleDepositClick} />
      </div>

      {showDepositModal && selectedVault && (
        <DepositModal
          vault={selectedVault}
          onClose={() => {
            setShowDepositModal(false);
            setSelectedVault(null);
          }}
        />
      )}
    </div>
  );
}
