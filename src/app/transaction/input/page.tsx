'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import TransactionForm from '@/components/transaction/TransactionForm';
import TransactionTable from '@/components/transaction/TransactionTable';
import { Transaction, NewTransaction } from '@/types/transaction';
import { transactionDB } from '@/utils/indexedDB';
import { Toast } from '@/components/common/Toast';

export default function TransactionInput() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTransactions = async () => {
    try {
      const allTransactions = await transactionDB.getAllTransactions();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('거래내역 로드 실패:', error);
      showToast('거래내역을 불러오는데 실패했습니다.', 'error');
    }
  };

  // 컴포넌트 마운트 시 초기화 및 이벤트 리스너 등록
  useEffect(() => {
    setIsClient(true);
    loadTransactions();

    // transactionUpdate 이벤트 리스너 등록
    const handleTransactionUpdate = () => {
      loadTransactions();
    };
    window.addEventListener('transactionUpdate', handleTransactionUpdate);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('transactionUpdate', handleTransactionUpdate);
    };
  }, []);

  const handleSaveTransaction = async (transaction: NewTransaction) => {
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: crypto.randomUUID()
      };
      
      await transactionDB.addTransaction(newTransaction);
      await loadTransactions(); // 거래내역 다시 로드
      showToast('거래내역이 저장되었습니다.', 'success');
    } catch (error) {
      console.error('거래내역 저장 실패:', error);
      showToast('거래내역 저장에 실패했습니다.', 'error');
    }
  };

  const handleUpdateTransaction = async (id: string, updatedTransaction: Transaction) => {
    try {
      await transactionDB.updateTransaction(id, updatedTransaction);
      await loadTransactions();
      showToast('거래내역이 수정되었습니다.', 'success');
    } catch (error) {
      console.error('거래내역 수정 실패:', error);
      showToast('거래내역 수정에 실패했습니다.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionDB.deleteTransaction(id);
      await loadTransactions();
      showToast('거래내역이 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('거래내역 삭제 실패:', error);
      showToast('거래내역 삭제에 실패했습니다.', 'error');
    }
  };

  // 클라이언트 사이드 렌더링 전에는 로딩 상태 표시
  if (!isClient) {
    return (
      <main className="min-h-[calc(100vh-8rem)] bg-[#17195c] text-white p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-2/4 mb-8"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[#17195c] text-white p-6">
      <div className="container mx-auto space-y-8">
        <PageHeader 
          title="거래 입력" 
          description="수입과 지출 내역을 입력하고 관리하세요."
        />
        
        {/* 신규거래입력 섹션 */}
        <section className="bg-[#232882]/40 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h2 className="text-2xl font-bold mb-6">신규거래입력</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 수입거래입력 */}
            <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/20">
              <h3 className="text-xl font-semibold mb-4">수입거래입력</h3>
              <TransactionForm 
                type="income"
                onSave={handleSaveTransaction}
              />
            </div>
            
            {/* 지출거래입력 */}
            <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
              <h3 className="text-xl font-semibold mb-4">지출거래입력</h3>
              <TransactionForm 
                type="expense"
                onSave={handleSaveTransaction}
              />
            </div>
          </div>
        </section>

        {/* 구분선 */}
        <div className="border-t-2 border-dotted border-white/20" />

        {/* 거래목록현황 섹션 */}
        <section className="bg-[#1d2170]/40 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h2 className="text-2xl font-bold mb-6">거래목록현황</h2>
          <TransactionTable 
            transactions={transactions}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        </section>
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </main>
  );
} 