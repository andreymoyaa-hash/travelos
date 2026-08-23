"use client";

import { type FormEvent, useState } from "react";
import { ArrowUpRight, CirclePlus, Pencil, ReceiptText, Users, X } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatMoney } from "@/lib/format";
import type { Budget, Currency, Expense, ExpenseCategory, ExpenseScope, Participant, Trip } from "@/types/travel";

interface ExpensesViewProps {
  trip: Trip;
  expenses: Expense[];
  activeParticipant: Participant;
  onAddExpense: (expense: Expense) => void;
  onUpdateBudget: (budget: Budget) => void;
}

const currencies: Currency[] = ["JPY", "CRC", "USD"];
const categories: Array<{ id: ExpenseCategory; label: string; icon: string; color: string }> = [
  { id: "food", label: "Comida", icon: "🍜", color: "#dd6b54" },
  { id: "shopping", label: "Compras", icon: "🛍️", color: "#9b6ab1" },
  { id: "transport", label: "Transporte", icon: "🚄", color: "#4e829a" },
  { id: "lodging", label: "Hospedaje", icon: "🏨", color: "#be884c" },
  { id: "tickets", label: "Entradas", icon: "🎟️", color: "#6d62a8" },
  { id: "gaming", label: "Gaming", icon: "🎮", color: "#4a936e" },
  { id: "pokemon", label: "Pokémon", icon: "⚡", color: "#d8ad25" },
  { id: "souvenirs", label: "Souvenirs", icon: "🎁", color: "#d65f7c" },
  { id: "other", label: "Otros", icon: "🧾", color: "#77716b" },
];

export function ExpensesView({ trip, expenses, activeParticipant, onAddExpense, onUpdateBudget }: ExpensesViewProps) {
  const [modal, setModal] = useState<"expense" | "budget">();
  const budgetExpenses = expenses.filter((expense) => expense.currency === trip.budget.currency);
  const spent = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = trip.budget.amount - spent;
  const budgetPercent = trip.budget.amount > 0 ? (spent / trip.budget.amount) * 100 : 0;

  const totalsByCurrency = currencies.map((currency) => ({
    currency,
    total: expenses.filter((expense) => expense.currency === currency).reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const totalsByCategory = categories.map((category) => ({
    ...category,
    total: budgetExpenses.filter((expense) => expense.category === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const largestCategoryTotal = Math.max(...totalsByCategory.map((category) => category.total), 1);

  const handleExpenseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryId = form.get("category") as ExpenseCategory;
    const category = categories.find((item) => item.id === categoryId) ?? categories[0];
    const amount = Number(form.get("amount"));
    const paidBy = String(form.get("paidBy") || activeParticipant.id);
    const scope = form.get("scope") as ExpenseScope;
    if (!Number.isFinite(amount) || amount <= 0) return;

    onAddExpense({
      id: `expense-${crypto.randomUUID()}`,
      title: String(form.get("title") || "Nuevo gasto"),
      category: category.id,
      amount,
      currency: form.get("currency") as Currency,
      paidBy,
      scope,
      splitBetween: scope === "shared" ? trip.participants.map((participant) => participant.id) : [paidBy],
      date: new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "short" }).format(new Date()),
      icon: category.icon,
    });
    setModal(undefined);
  };

  const handleBudgetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("budgetAmount"));
    if (!Number.isFinite(amount) || amount < 0) return;
    onUpdateBudget({ amount, currency: form.get("budgetCurrency") as Currency });
    setModal(undefined);
  };

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Dinero con propósito"
        title="Finanzas"
        description="Registra quién pagó, en qué moneda y si el gasto fue individual o compartido."
        action={<button type="button" className="primary-button" onClick={() => setModal("expense")}><CirclePlus size={17} aria-hidden="true" /> Registrar gasto</button>}
      />

      <section className="finance-overview">
        <article className="budget-hero-card">
          <div className="budget-orbit" style={{ "--budget-progress": `${Math.min(budgetPercent, 100) * 3.6}deg` } as React.CSSProperties}><span><strong>{trip.budget.amount > 0 ? `${Math.max(0, Math.round(100 - budgetPercent))}%` : "—"}</strong><small>disponible</small></span></div>
          <div>
            <p className="eyebrow">Presupuesto disponible</p>
            <h2>{trip.budget.amount > 0 ? formatMoney(remaining, trip.budget.currency) : "Sin definir"}</h2>
            <p>{trip.budget.amount > 0 ? `de ${formatMoney(trip.budget.amount, trip.budget.currency)} para todo el viaje` : "Define el monto y la moneda principal del viaje."}</p>
            <ProgressBar value={Math.min(budgetPercent, 100)} color="var(--highlight)" label="Presupuesto usado" />
            <button type="button" className="text-link" onClick={() => setModal("budget")}><Pencil size={14} /> Editar presupuesto</button>
          </div>
        </article>

        <article className="finance-stat-card"><span className="finance-stat-icon"><ArrowUpRight size={19} /></span><p>Gastado</p><strong>{formatMoney(spent, trip.budget.currency)}</strong><small>{Math.round(budgetPercent)}% del presupuesto</small></article>
        <article className="finance-stat-card"><span className="finance-stat-icon purple"><Users size={19} /></span><p>Participantes</p><strong>{trip.participants.length}</strong><small>Andy y José, cuentas separadas</small></article>
      </section>

      <div className="currency-summary" aria-label="Totales registrados por moneda">
        {totalsByCurrency.map(({ currency, total }) => <span key={currency}><small>{currency}</small><strong>{formatMoney(total, currency)}</strong></span>)}
      </div>
      <p className="data-note">El presupuesto se compara sólo con gastos en {trip.budget.currency}; no se aplican tipos de cambio inventados.</p>

      <section className="participant-totals" aria-label="Totales pagados por participante">
        {trip.participants.map((participant) => (
          <article key={participant.id}>
            <span style={{ backgroundColor: participant.color }}>{participant.initials}</span>
            <div><small>Pagado por {participant.name}</small>{totalsByCurrency.map(({ currency }) => {
              const total = expenses.filter((expense) => expense.paidBy === participant.id && expense.currency === currency).reduce((sum, expense) => sum + expense.amount, 0);
              return <strong key={currency}>{formatMoney(total, currency)}</strong>;
            })}</div>
          </article>
        ))}
      </section>

      <div className="finance-layout">
        <section className="surface-card category-breakdown">
          <header className="card-header-row"><div><p className="eyebrow">Distribución</p><h2>¿En qué se va?</h2></div><span className="currency-pill">{trip.budget.currency}</span></header>
          <div className="category-bars">
            {totalsByCategory.map((category) => (
              <div className="category-row" key={category.id}><span className="category-emoji">{category.icon}</span><div><span><strong>{category.label}</strong><small>{formatMoney(category.total, trip.budget.currency)}</small></span><div className="category-track"><i style={{ width: `${(category.total / largestCategoryTotal) * 100}%`, backgroundColor: category.color }} /></div></div></div>
            ))}
          </div>
        </section>

        <section className="surface-card expense-list-card">
          <header className="card-header-row"><div><p className="eyebrow">Actividad reciente</p><h2>Últimos gastos</h2></div><ReceiptText size={20} aria-hidden="true" /></header>
          {expenses.length === 0 ? (
            <div className="empty-state compact"><span>¥</span><h2>No tienes gastos registrados</h2><p>Usa “Registrar gasto” cuando Andy o José hagan el primer pago.</p></div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => {
                const participant = trip.participants.find((item) => item.id === expense.paidBy);
                return (
                  <article className="expense-row" key={expense.id}><span className="expense-emoji">{expense.icon}</span><div><strong>{expense.title}</strong><small>{expense.date} · Pagó {participant?.name ?? "Participante"} · {expense.scope === "shared" ? "Compartido" : "Individual"}</small></div><span className="expense-amount">−{formatMoney(expense.amount, expense.currency)}</span></article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {modal === "expense" ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(undefined)}>
          <section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><p className="eyebrow">Nuevo movimiento</p><h2 id="expense-title">Registrar gasto</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setModal(undefined)}><X size={20} /></button></header>
            <form onSubmit={handleExpenseSubmit}>
              <label>Descripción<input name="title" placeholder="Ej. Cena de ramen" required autoFocus /></label>
              <div className="form-grid">
                <label>Monto<input name="amount" type="number" min="0.01" step="0.01" required /></label>
                <label>Moneda<select name="currency" defaultValue={trip.budget.currency}>{currencies.map((currency) => <option value={currency} key={currency}>{currency}</option>)}</select></label>
              </div>
              <div className="form-grid">
                <label>Categoría<select name="category" defaultValue="food">{categories.map((category) => <option value={category.id} key={category.id}>{category.icon} {category.label}</option>)}</select></label>
                <label>Pagó<select name="paidBy" defaultValue={activeParticipant.id}>{trip.participants.map((participant) => <option value={participant.id} key={participant.id}>{participant.name}</option>)}</select></label>
              </div>
              <label>Tipo de gasto<select name="scope" defaultValue="shared"><option value="shared">Compartido entre Andy y José</option><option value="individual">Individual de quien pagó</option></select></label>
              <button type="submit" className="primary-button full-width">Guardar gasto</button>
            </form>
          </section>
        </div>
      ) : null}

      {modal === "budget" ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(undefined)}>
          <section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="budget-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><p className="eyebrow">Plan financiero</p><h2 id="budget-title">Editar presupuesto</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setModal(undefined)}><X size={20} /></button></header>
            <form onSubmit={handleBudgetSubmit}>
              <label>Presupuesto total<input name="budgetAmount" type="number" min="0" step="0.01" defaultValue={trip.budget.amount} required autoFocus /></label>
              <label>Moneda principal<select name="budgetCurrency" defaultValue={trip.budget.currency}>{currencies.map((currency) => <option value={currency} key={currency}>{currency}</option>)}</select></label>
              <button type="submit" className="primary-button full-width">Actualizar presupuesto</button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
