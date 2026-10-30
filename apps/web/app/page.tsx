"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ============================================================
// Types
// ============================================================
interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  date: string;
  categoryId: number;
  category: Category;
  createdAt: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  byCategory: { category: Category; total: number; count: number }[];
  dailyTotals: { date: string; income: number; expense: number }[];
  month: number;
  year: number;
}

interface TransactionResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ============================================================
// Utility
// ============================================================
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// ============================================================
// Component
// ============================================================
export default function HomePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<TransactionResponse["meta"] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form state
  const [formType, setFormType] = useState<string>("EXPENSE");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]!);
  const [formCategory, setFormCategory] = useState<number>(0);

  // Toast helper
  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/summary?month=${month}&year=${year}`);
      const data = await res.json();
      setSummary(data);
    } catch {
      console.error("Failed to fetch summary");
    }
  }, [month, year]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
      const typeParam = filterType !== "ALL" ? `&type=${filterType}` : "";
      const res = await fetch(
        `${API_URL}/transactions?startDate=${startDate}&endDate=${endDate}${typeParam}&page=${page}&limit=10`
      );
      const data: TransactionResponse = await res.json();
      setTransactions(data.data);
      setMeta(data.meta);
    } catch {
      console.error("Failed to fetch transactions");
    }
  }, [month, year, filterType, page]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  // Init
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchTransactions(), fetchCategories()]);
      setLoading(false);
    };
    void init();
  }, [fetchSummary, fetchTransactions, fetchCategories]);

  // Month navigation
  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setPage(1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setPage(1);
  };

  // Open modal
  const openNewTransaction = () => {
    setEditTransaction(null);
    setFormType("EXPENSE");
    setFormAmount("");
    setFormDesc("");
    setFormDate(new Date().toISOString().split("T")[0]!);
    setFormCategory(0);
    setShowModal(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditTransaction(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormDesc(tx.description);
    setFormDate(tx.date.split("T")[0]!);
    setFormCategory(tx.categoryId);
    setShowModal(true);
  };

  // Submit transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formDesc || !formCategory) {
      addToast("Mohon lengkapi semua field!", "error");
      return;
    }

    try {
      const body = {
        amount: parseFloat(formAmount),
        type: formType,
        description: formDesc,
        date: formDate,
        categoryId: formCategory,
      };

      if (editTransaction) {
        await fetch(`${API_URL}/transactions/${editTransaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        addToast("Transaksi berhasil diperbarui! ✏️", "success");
      } else {
        await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        addToast("Transaksi berhasil ditambahkan! 🎉", "success");
      }

      setShowModal(false);
      await Promise.all([fetchSummary(), fetchTransactions()]);
    } catch {
      addToast("Gagal menyimpan transaksi", "error");
    }
  };

  // Delete transaction
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      addToast("Transaksi berhasil dihapus! 🗑️", "success");
      await Promise.all([fetchSummary(), fetchTransactions()]);
    } catch {
      addToast("Gagal menghapus transaksi", "error");
    }
  };

  // Filtered categories for form
  const filteredCategories = categories.filter((c) => c.type === formType);

  // Chart max value
  const chartMax = summary
    ? Math.max(...summary.dailyTotals.map((d) => Math.max(d.income, d.expense)), 1)
    : 1;

  // Category max for progress bars
  const categoryMax = summary
    ? Math.max(...summary.byCategory.map((c) => c.total), 1)
    : 1;

  return (
    <div className="app-container">
      {/* TOAST */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">{toast.type === "success" ? "✅" : "❌"}</span>
            {toast.message}
          </div>
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">💰</div>
          <div>
            <div className="navbar-title">DuitKu</div>
            <div className="navbar-subtitle">Manajemen Keuangan Pribadi</div>
          </div>
        </div>
        <div className="navbar-actions">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={prevMonth} aria-label="Bulan sebelumnya">
              ◀
            </button>
            <span className="month-nav-label">
              {MONTHS[month - 1]} {year}
            </span>
            <button className="month-nav-btn" onClick={nextMonth} aria-label="Bulan berikutnya">
              ▶
            </button>
          </div>
          <button className="btn-primary" onClick={openNewTransaction} id="btn-add-transaction">
            <span>＋</span> Tambah Transaksi
          </button>
        </div>
      </nav>

      {/* SUMMARY CARDS */}
      {loading ? (
        <div className="summary-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="summary-card">
              <div className="skeleton" style={{ width: 48, height: 48, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 150, height: 28 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="summary-grid">
          <div className="summary-card income">
            <div className="summary-card-icon">📈</div>
            <div className="summary-card-label">Total Pemasukan</div>
            <div className="summary-card-value">{formatRupiah(summary?.totalIncome ?? 0)}</div>
          </div>
          <div className="summary-card expense">
            <div className="summary-card-icon">📉</div>
            <div className="summary-card-label">Total Pengeluaran</div>
            <div className="summary-card-value">{formatRupiah(summary?.totalExpense ?? 0)}</div>
          </div>
          <div className="summary-card balance">
            <div className="summary-card-icon">💎</div>
            <div className="summary-card-label">Saldo</div>
            <div className="summary-card-value">{formatRupiah(summary?.balance ?? 0)}</div>
          </div>
          <div className="summary-card count">
            <div className="summary-card-icon">📊</div>
            <div className="summary-card-label">Transaksi</div>
            <div className="summary-card-value">{summary?.transactionCount ?? 0}</div>
          </div>
        </div>
      )}

      {/* CONTENT GRID: Chart + Category Breakdown */}
      <div className="content-grid">
        {/* Daily Chart */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-icon">📊</span>
              Grafik Harian
            </div>
          </div>
          <div className="chart-container">
            {summary && summary.dailyTotals.length > 0 ? (
              <div className="chart-bars">
                {summary.dailyTotals.map((day) => (
                  <div className="chart-bar-group" key={day.date}>
                    <div className="chart-bar-pair">
                      <div
                        className="chart-bar income"
                        style={{
                          height: `${(day.income / chartMax) * 180}px`,
                        }}
                        title={`Pemasukan: ${formatRupiah(day.income)}`}
                      />
                      <div
                        className="chart-bar expense"
                        style={{
                          height: `${(day.expense / chartMax) * 180}px`,
                        }}
                        title={`Pengeluaran: ${formatRupiah(day.expense)}`}
                      />
                    </div>
                    <span className="chart-bar-label">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">Belum ada data</div>
                <div className="empty-state-sub">Tambahkan transaksi untuk melihat grafik</div>
              </div>
            )}
          </div>
          <div className="chart-legend">
            <div className="chart-legend-item">
              <div className="chart-legend-dot income" />
              Pemasukan
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot expense" />
              Pengeluaran
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-icon">📁</span>
              Per Kategori
            </div>
          </div>
          <div className="panel-body">
            {summary && summary.byCategory.length > 0 ? (
              <div className="category-list">
                {summary.byCategory
                  .sort((a, b) => b.total - a.total)
                  .map((item) => (
                    <div className="category-item" key={item.category.id}>
                      <div
                        className="category-icon-wrapper"
                        style={{ background: `${item.category.color}20` }}
                      >
                        {item.category.icon}
                      </div>
                      <div className="category-info">
                        <div className="category-name">{item.category.name}</div>
                        <div className="category-count">
                          {item.count} transaksi
                        </div>
                        <div className="category-bar-track">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${(item.total / categoryMax) * 100}%`,
                              background: item.category.color,
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className="category-amount"
                        style={{ color: item.category.type === "INCOME" ? "var(--income-color)" : "var(--expense-color)" }}
                      >
                        {formatRupiah(item.total)}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <div className="empty-state-text">Belum ada data</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="panel history-section">
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-icon">📋</span>
            Riwayat Transaksi
          </div>
          <div className="history-filters">
            {["ALL", "INCOME", "EXPENSE"].map((type) => (
              <button
                key={type}
                className={`filter-btn ${filterType === type ? "active" : ""}`}
                onClick={() => {
                  setFilterType(type);
                  setPage(1);
                }}
              >
                {type === "ALL" ? "Semua" : type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 44, height: 44 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: "30%", height: 10 }} />
                  </div>
                  <div className="skeleton" style={{ width: 100, height: 18 }} />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="transaction-list">
              {transactions.map((tx) => (
                <div className="transaction-item" key={tx.id}>
                  <div
                    className="transaction-icon"
                    style={{ background: `${tx.category.color}20` }}
                  >
                    {tx.category.icon}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-desc">{tx.description}</div>
                    <div className="transaction-meta">
                      <span>{formatDate(tx.date)}</span>
                      <span
                        className="transaction-category-badge"
                        style={{
                          color: tx.category.color,
                          borderColor: `${tx.category.color}40`,
                          background: `${tx.category.color}10`,
                        }}
                      >
                        {tx.category.icon} {tx.category.name}
                      </span>
                    </div>
                  </div>
                  <div className={`transaction-amount ${tx.type.toLowerCase()}`}>
                    {tx.type === "INCOME" ? "+" : "-"} {formatRupiah(tx.amount)}
                  </div>
                  <div className="transaction-actions">
                    <button
                      className="action-btn"
                      onClick={() => openEditTransaction(tx)}
                      title="Edit"
                      aria-label="Edit transaksi"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(tx.id)}
                      title="Hapus"
                      aria-label="Hapus transaksi"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">Belum ada transaksi</div>
              <div className="empty-state-sub">
                Klik &quot;Tambah Transaksi&quot; untuk memulai
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                ◀ Prev
              </button>
              <span className="pagination-info">
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} transaksi)
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editTransaction ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Type Toggle */}
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-toggle-btn income ${formType === "INCOME" ? "active" : ""}`}
                    onClick={() => {
                      setFormType("INCOME");
                      setFormCategory(0);
                    }}
                  >
                    📈 Pemasukan
                  </button>
                  <button
                    type="button"
                    className={`type-toggle-btn expense ${formType === "EXPENSE" ? "active" : ""}`}
                    onClick={() => {
                      setFormType("EXPENSE");
                      setFormCategory(0);
                    }}
                  >
                    📉 Pengeluaran
                  </button>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label" htmlFor="form-amount">
                    Jumlah (Rp)
                  </label>
                  <input
                    id="form-amount"
                    className="form-input"
                    type="number"
                    placeholder="Contoh: 500000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" htmlFor="form-desc">
                    Deskripsi
                  </label>
                  <input
                    id="form-desc"
                    className="form-input"
                    type="text"
                    placeholder="Contoh: Makan siang di warung"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label" htmlFor="form-category">
                    Kategori
                  </label>
                  <select
                    id="form-category"
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(parseInt(e.target.value, 10))}
                    required
                  >
                    <option value={0} disabled>
                      Pilih kategori
                    </option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="form-group">
                  <label className="form-label" htmlFor="form-date">
                    Tanggal
                  </label>
                  <input
                    id="form-date"
                    className="form-input"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary ${formType === "INCOME" ? "btn-income" : "btn-expense"}`}
                  >
                    {editTransaction ? "Simpan Perubahan" : "Tambah"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
