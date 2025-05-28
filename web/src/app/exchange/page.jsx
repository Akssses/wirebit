"use client";

import { useState, useEffect } from "react";
import { FiChevronDown, FiUser, FiInfo } from "react-icons/fi";
import cx from "classnames";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/ExchangePage.module.scss";
import api from "@/services/api";
import StatusChecker from "@/components/StatusChecker";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function ExchangePage() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [availableTo, setAvailableTo] = useState([]);
  const [directions, setDirections] = useState([]);

  const { isAuthenticated, user } = useAuth();

  // Загрузка валют при монтировании
  useEffect(() => {
    loadCurrencies();
    loadDirections();
  }, []);

  // Предзаполнение email из профиля пользователя
  useEffect(() => {
    if (isAuthenticated && user?.email && !email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user, email]);

  // Загрузка доступных валют для получения при изменении from
  useEffect(() => {
    if (from) {
      loadAvailableTo(from.title);
    } else {
      setAvailableTo([]);
      setTo(null);
    }
  }, [from]);

  const loadCurrencies = async () => {
    try {
      const data = await api.getCurrencies();
      setCurrencies(data);
    } catch (error) {
      toast.error("Ошибка загрузки валют");
    }
  };

  const loadAvailableTo = async (fromCurrency) => {
    try {
      const data = await api.getAvailableTo(fromCurrency);
      setAvailableTo(data);
    } catch (error) {
      toast.error("Ошибка загрузки доступных валют");
    }
  };

  const loadDirections = async () => {
    try {
      const data = await api.getDirections();
      setDirections(data);
    } catch (error) {
      toast.error("Ошибка загрузки направлений обмена");
    }
  };

  const getDirection = () => {
    if (!from || !to) return null;
    return directions.find((d) => d.from === from.title && d.to === to.title);
  };

  const getRate = () => {
    const direction = getDirection();
    return direction ? direction.rate : null;
  };

  const receive = () => {
    const rate = getRate();
    return rate ? (+amount || 0) * rate : 0;
  };

  const validateWalletAddress = (address, currency) => {
    if (!address.trim()) return "Укажите ID кошелька";

    // Basic validation for different currencies
    const trimmedAddress = address.trim();

    if (currency.includes("Bitcoin") || currency.includes("BTC")) {
      // Bitcoin address validation (basic)
      if (
        !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(
          trimmedAddress
        )
      ) {
        return "Неправильный формат Bitcoin адреса";
      }
    } else if (
      currency.includes("Ethereum") ||
      currency.includes("ETH") ||
      currency.includes("ERC20")
    ) {
      // Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        return "Неправильный формат Ethereum адреса";
      }
    } else if (
      currency.includes("Tether TRC20") ||
      currency.includes("TRON") ||
      currency.includes("TRX")
    ) {
      // TRON address validation
      if (!/^T[A-Za-z1-9]{33}$/.test(trimmedAddress)) {
        return "Неправильный формат TRON адреса";
      }
    } else if (currency.includes("DOGE")) {
      // Dogecoin address validation
      if (
        !/^D[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/.test(trimmedAddress)
      ) {
        return "Неправильный формат Dogecoin адреса";
      }
    }

    // For other currencies, just check minimum length
    if (trimmedAddress.length < 10) {
      return "Адрес слишком короткий";
    }

    return null;
  };

  const validate = () => {
    const e = {};
    if (!from) e.from = true;
    if (!to) e.to = true;

    const direction = getDirection();
    if (direction) {
      if (!amount || +amount <= 0) {
        e.amount = "Введите сумму";
      } else if (+amount < direction.min || +amount > direction.max) {
        e.amount = `Допустимо ${direction.min} – ${direction.max}`;
      }
    } else if (!amount || +amount <= 0) {
      e.amount = "Введите сумму";
    }

    // Validate wallet address with currency-specific rules
    if (to) {
      const walletError = validateWalletAddress(wallet, to.title);
      if (walletError) e.wallet = walletError;
    } else if (!wallet.trim()) {
      e.wallet = "Укажите ID кошелька";
    }

    if (!email.trim()) e.email = "Укажите Email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Некорректный Email";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const direction = getDirection();
    if (!direction) {
      toast.error("Направление обмена не найдено");
      return;
    }

    setLoading(true);
    try {
      const result = await api.createExchange({
        direction_id: direction.direction_id,
        amount: parseFloat(amount),
        account_to: wallet,
        cf6: email,
      });

      if (result.success) {
        const successMessage = result.message || "Заявка успешно создана!";
        if (isAuthenticated) {
          toast.success(successMessage + " Обмен сохранен в вашей истории.");
        } else {
          toast.success(successMessage);
        }

        // Очистка формы
        setAmount("");
        setWallet("");
        // Не очищаем email если пользователь авторизован
        if (!isAuthenticated) {
          setEmail("");
        }
        setFrom(null);
        setTo(null);

        // Можно сохранить bid_id для отслеживания статуса
        if (result.bid_id) {
          localStorage.setItem("lastBidId", result.bid_id);
        }
      } else {
        toast.error(result.message || "Ошибка создания заявки");
      }
    } catch (error) {
      toast.error(error.message || "Ошибка при отправке заявки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className={s.wrap} onSubmit={handleSubmit}>
        <div className={s.header}>
          <h1 className={s.pageTitle}>Обмен валют</h1>

          {/* User Status */}
          {isAuthenticated ? (
            <div className={s.userInfo}>
              <div className={s.userHeader}>
                <FiUser className={s.userIcon} />
                <span className={s.username}>
                  Вы авторизованы как {user?.username}
                </span>
              </div>

              <div className={s.authBenefit}>
                <FiInfo className={s.infoIcon} />
                <span>Обмены сохраняются в истории</span>
              </div>
            </div>
          ) : (
            <div className={s.authPrompt}>
              <Link href="/login" className={s.loginPrompt}>
                Войдите в аккаунт для сохранения истории обменов
              </Link>
            </div>
          )}
        </div>

        <CurrencySelect
          label="Отдаю"
          value={from}
          onChange={setFrom}
          currencies={currencies}
          error={errors.from}
        />

        <CurrencySelect
          label="Получаю"
          value={to}
          onChange={setTo}
          currencies={availableTo}
          error={errors.to}
          disabled={!from}
        />

        <div className={cx(s.field, errors.amount && s.error)}>
          <label>Сумма*</label>
          <input
            type="number"
            placeholder="00.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
          />
          {errors.amount && <span className={s.msg}>{errors.amount}</span>}
          {!errors.amount && getDirection() && (
            <div className="flex justify-end gap-[10px] mr-[20px]">
              <span className={s.limits}>Min: {getDirection().min}</span>
              <span className={s.limits}>Max: {getDirection().max}</span>
            </div>
          )}
        </div>

        {from && to && amount && getRate() && (
          <div className={s.readonlyField}>
            <label>Вы получите</label>
            <input value={receive().toFixed(6)} readOnly tabIndex={-1} />
            <span className={s.rate}>
              Курс: 1 {from.title} = {getRate()} {to.title}
            </span>
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

        <div className={cx(s.field, errors.email && s.error)}>
          <label>
            Персональная информация<span>*</span>
          </label>
          <input
            placeholder="Укажите Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAuthenticated && user?.email}
          />
          {errors.email && <span className={s.msg}>{errors.email}</span>}
          {isAuthenticated && user?.email && (
            <span className={s.helperText}>
              Используется email из вашего профиля
            </span>
          )}
        </div>

        <button className={s.submit} disabled={loading}>
          {loading ? "Обработка..." : "Подтвердить"}
        </button>
      </form>

      {/* <StatusChecker /> */}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

function CurrencySelect({
  label,
  value,
  onChange,
  currencies,
  error,
  disabled,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cx(s.selectWrap, error && s.error, disabled && s.disabled)}>
      <label>{label}</label>

      <button
        type="button"
        className={s.selectBtn}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        {value ? (
          <>
            {value.logo && (
              <img
                src={value.logo}
                alt=""
                width={28}
                height={28}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <span>{value.title}</span>
          </>
        ) : (
          <span className={s.placeholder}>
            {disabled ? "Сначала выберите валюту отправки" : "Выберите валюту"}
          </span>
        )}
        <FiChevronDown className={cx(s.chevron, open && s.open)} />
      </button>

      {open && !disabled && (
        <ul className={s.dropdown}>
          {currencies.map((currency) => (
            <li key={currency.title}>
              <button
                type="button"
                onClick={() => {
                  onChange(currency);
                  setOpen(false);
                }}
              >
                {currency.logo && (
                  <img
                    src={currency.logo}
                    alt=""
                    width={24}
                    height={24}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                {currency.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
