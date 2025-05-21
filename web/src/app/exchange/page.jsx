"use client";

import { useState } from "react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import cx from "classnames";
import s from "@/styles/ExchangePage.module.scss";

const coins = [
  {
    code: "USDT",
    name: "Tether USDT",
    icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg",
  },
  {
    code: "ETH",
    name: "Ethereum",
    icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg",
  },
  {
    code: "DOGE",
    name: "Dogecoin",
    icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg",
  },
  {
    code: "TRX",
    name: "Tron TRX",
    icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/trx.svg",
  },
];

const rates = {
  USDT_DOGE: 5.97431569,
  USDT_ETH: 0.00029,
  DOGE_USDT: 0.1673,
};

export default function ExchangePage() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [errors, setErrors] = useState({});

  const getRate = () =>
    from && to ? rates[`${from.code}_${to.code}`] ?? null : null;

  const receive = () => {
    const r = getRate();
    return r ? (+amount || 0) * r : 0;
  };

  const validate = () => {
    const e = {};
    if (!from) e.from = true;
    if (!to) e.to = true;
    if (!amount || +amount <= 0) e.amount = "Введите сумму";
    else if (+amount < 270 || +amount > 1000) e.amount = "Допустимо 270 – 1000";
    if (!wallet.trim()) e.wallet = "Укажите ID";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    alert("🎉 Форма валидна, отправляем…");
  };

  return (
    <form className={s.wrap} onSubmit={handleSubmit}>
      <h1 className={s.pageTitle}>Обмен валют</h1>

      <CurrencySelect
        label="Отдаю"
        value={from}
        onChange={setFrom}
        error={errors.from}
      />

      <CurrencySelect
        label="Получаю"
        value={to}
        onChange={setTo}
        exclude={from?.code}
        error={errors.to}
      />

      <div className={cx(s.field, errors.amount && s.error)}>
        <label>Сумма*</label>
        <input
          type="number"
          placeholder="00.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {errors.amount && <span className={s.msg}>{errors.amount}</span>}
        <div className="flex justify-end gap-[10px] mr-[20px]">
          {!errors.amount && <span className={s.limits}>Min: 270</span>}
          {!errors.amount && <span className={s.limits}>Max: 1000</span>}
        </div>
      </div>

      {from && to && amount && (
        <div className={s.readonlyField}>
          <label>Вы получите</label>
          <input value={receive().toFixed(6)} readOnly tabIndex={-1} />
          {getRate() && (
            <span className={s.rate}>
              Курс: 1 {from.code} = {getRate()} {to.code}
            </span>
          )}
        </div>
      )}

      <div className={cx(s.field, errors.wallet && s.error)}>
        <label>
          ID кошелька получателя<span>*</span>
        </label>
        <input
          placeholder="Укажите ID"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />
        {errors.wallet && <span className={s.msg}>{errors.wallet}</span>}
      </div>

      <div className={s.field}>
        <label>Персональная информация</label>
        <input placeholder="Укажите Email" type="email" />
      </div>

      <button className={s.submit}>Подтвердить</button>
    </form>
  );
}

function CurrencySelect({ label, value, onChange, exclude, error }) {
  const [open, setOpen] = useState(false);
  const list = exclude ? coins.filter((c) => c.code !== exclude) : coins;

  return (
    <div className={cx(s.selectWrap, error && s.error)}>
      <label>{label}</label>

      <button
        type="button"
        className={s.selectBtn}
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <>
            <Image src={value.icon} alt="" width={28} height={28} />
            <span>{value.name}</span>
          </>
        ) : (
          <span className={s.placeholder}>Выберите валюту</span>
        )}
        <FiChevronDown className={cx(s.chevron, open && s.rotated)} size={22} />
      </button>

      {open && (
        <ul className={s.dropdown}>
          {list.map((coin) => (
            <li key={coin.code}>
              <button
                type="button"
                onClick={() => {
                  onChange(coin);
                  setOpen(false);
                }}
              >
                <Image src={coin.icon} alt="" width={24} height={24} />
                {coin.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
