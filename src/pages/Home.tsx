import { AlertCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { FundTable } from '../components/FundTable';
import { FundCardList } from '../components/FundCard';
import { Footer } from '../components/Footer';
import { Loading } from '../components/Loading';
import { useFundData } from '../hooks/useFundData';

export default function Home() {
  const {
    funds,
    loading,
    returnsLoading,
    error,
    lastUpdated,
    filters,
    setFilters,
    refresh,
    filteredFunds,
  } = useFundData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
        returnsLoading={returnsLoading}
      />

      <main className="flex-1 container py-6 md:py-8">
        {error && (
          <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
            <span className="text-danger-500">{error}</span>
          </div>
        )}

        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          totalCount={funds.length}
          filteredCount={filteredFunds.length}
        />

        <div className="mt-6">
          {loading ? (
            <Loading />
          ) : (
            <>
              <FundTable funds={filteredFunds} returnsLoading={returnsLoading} />
              <FundCardList funds={filteredFunds} returnsLoading={returnsLoading} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
