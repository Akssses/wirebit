"use client";

import { useState, useEffect } from "react";
import { FiChevronDown, FiUser, FiInfo, FiAlertTriangle } from "react-icons/fi";
import cx from "classnames";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/ExchangePage.module.scss";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import verificationApi from "@/services/verificationApi";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

function ExchangePageContent() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [email, setEmail] = useState("");

  // Поля для рублевых обменов
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [telegram, setTelegram] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [availableTo, setAvailableTo] = useState([]);
  const [directions, setDirections] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const { user } = useAuth();

  // Загрузка валют при монтировании
  useEffect(() => {
    loadCurrencies();
    loadDirections();
    loadVerificationStatus();
  }, []);

  // Предзаполнение email из профиля пользователя
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Проверка требований верификации при изменении валют
  useEffect(() => {
    checkVerificationRequirements();
  }, [from, to, verificationStatus]);

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

  const loadVerificationStatus = async () => {
    try {
      const status = await verificationApi.getVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
  };

  const checkVerificationRequirements = () => {
    if (!from || !to) {
      setVerificationRequired(false);
      return;
    }

    // Проверяем, требуется ли верификация для Zelle USD -> RUB обменов
    const isZelleToRub =
      from.title === "Zelle USD" &&
      (to.title === "Банковская карта RUB" ||
        to.title === "СБП RUB" ||
        to.title === "Сбербанк RUB" ||
        to.title === "Т-Банк RUB" ||
        to.title === "Альфа-Банк RUB");

    setVerificationRequired(isZelleToRub);
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

    // Валидация в зависимости от типа направления
    if (isRubDirection()) {
      // Валидация для рублевых направлений
      if (!cardNumber.trim()) e.cardNumber = "Укажите номер карты";
      else if (!/^\d{16,19}$/.test(cardNumber.replace(/\s/g, ""))) {
        e.cardNumber = "Номер карты должен содержать 16-19 цифр";
      }

      if (!cardHolderName.trim())
        e.cardHolderName = "Укажите имя владельца карты";

      if (!email.trim()) e.email = "Укажите Email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.email = "Некорректный Email";
      }

      if (!telegram.trim()) e.telegram = "Укажите Telegram или WhatsApp";
    } else {
      // Валидация для крипто направлений
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
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getVerificationBlockType = () => {
    if (!verificationRequired) return null;

    if (!verificationStatus) {
      return {
        type: "verification",
        title: "Требуется верификация",
        message:
          "Для обмена Zelle USD на рублевые платежные системы необходимо пройти верификацию аккаунта.",
        actionText: "Пройти верификацию",
        actionLink: "/verification",
        canProceed: false,
      };
    }

    switch (verificationStatus.verification_status) {
      case "approved":
        return null; // Верификация пройдена, можно продолжать

      case "pending":
        return {
          type: "pending",
          title: "Верификация на рассмотрении",
          message:
            "Ваша заявка на верификацию находится в обработке. Дождитесь подтверждения администратора для совершения этого обмена.",
          actionText: "Проверить статус",
          actionLink: "/verification",
          canProceed: false,
        };

      case "rejected":
        return {
          type: "rejected",
          title: "Верификация отклонена",
          message:
            "Ваша заявка на верификацию была отклонена. Подайте новую заявку или обратитесь в службу поддержки.",
          actionText: "Повторить верификацию",
          actionLink: "/verification",
          canProceed: false,
        };

      default:
        return {
          type: "verification",
          title: "Требуется верификация",
          message:
            "Для обмена Zelle USD на рублевые платежные системы необходимо пройти верификацию аккаунта.",
          actionText: "Пройти верификацию",
          actionLink: "/verification",
          canProceed: false,
        };
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const verificationBlock = getVerificationBlockType();
    if (verificationBlock && !verificationBlock.canProceed) {
      toast.error(verificationBlock.message);
      return;
    }

    const direction = getDirection();
    if (!direction) {
      toast.error("Направление обмена не найдено");
      return;
    }

    setLoading(true);
    try {
      let exchangeData = {
        direction_id: direction.direction_id,
        amount: parseFloat(amount),
      };

      if (isRubDirection()) {
        // Для рублевых обменов
        exchangeData = {
          ...exchangeData,
          account2: cardNumber.replace(/\s/g, ""), // номер карты без пробелов
          cfgive8: cardHolderName, // имя владельца карты
          cf6: email, // email
          cf11: telegram, // telegram/whatsapp
        };
      } else {
        // Для крипто обменов
        exchangeData = {
          ...exchangeData,
          account_to: wallet,
          cf6: email,
        };
      }

      const result = await api.createExchange(exchangeData);

      if (result.success) {
        const successMessage = result.message || "Заявка успешно создана!";
        toast.success(successMessage + " Обмен сохранен в вашей истории.");

        // Очистка формы
        setAmount("");
        setWallet("");
        setCardNumber("");
        setCardHolderName("");
        setTelegram("");
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

  const verificationBlock = getVerificationBlockType();

  // Функция для определения рублевого направления
  const isRubDirection = () => {
    if (!to) return false;
    return (
      to.title.includes("RUB") ||
      to.title.includes("рубл") ||
      to.title.includes("Банковская карта") ||
      to.title.includes("СБП") ||
      to.title.includes("Сбербанк") ||
      to.title.includes("Т-Банк") ||
      to.title.includes("Альфа-Банк")
    );
  };

  // Функция для форматирования номера карты
  const formatCardNumber = (value) => {
    // Убираем все, кроме цифр
    const cleaned = value.replace(/\D/g, "");
    // Добавляем пробелы каждые 4 цифры
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 23) {
      // 19 цифр + 4 пробела максимум
      setCardNumber(formatted);
    }
  };

  return (
    <>
      <form className={s.wrap} onSubmit={handleSubmit}>
        <div className={s.header}>
          <h1 className={s.pageTitle}>Обмен валют</h1>

          {/* User Status */}
          <div className={s.userInfo}>
            <div className={s.user_info_flex}>
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

        {/* Verification Warning Block */}
        {verificationBlock && (
          <div
            className={`${s.verificationWarning} ${s[verificationBlock.type]}`}
          >
            <div className={s.warningHeader}>
              <FiAlertTriangle className={s.warningIcon} />
              <span className={s.warningTitle}>{verificationBlock.title}</span>
            </div>
            <p className={s.warningMessage}>{verificationBlock.message}</p>
            <Link
              href={verificationBlock.actionLink}
              className={s.warningAction}
            >
              {verificationBlock.actionText}
            </Link>
          </div>
        )}

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

        {/* Поля для рублевых обменов */}
        {isRubDirection() ? (
          <>
            <div className={cx(s.field, errors.cardNumber && s.error)}>
              <label>
                На карту<span>*</span>
              </label>
              <input
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
              />
              {errors.cardNumber && (
                <span className={s.msg}>{errors.cardNumber}</span>
              )}
            </div>

            <div className={cx(s.field, errors.cardHolderName && s.error)}>
              <label>
                ФИО владельца карты<span>*</span>
              </label>
              <input
                placeholder="Иванов Иван Иванович"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
              />
              {errors.cardHolderName && (
                <span className={s.msg}>{errors.cardHolderName}</span>
              )}
            </div>

            <div className={cx(s.field, errors.telegram && s.error)}>
              <label>
                WhatsApp/Telegram<span>*</span>
              </label>
              <input
                placeholder="@username или +7 900 123 45 67"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
              {errors.telegram && (
                <span className={s.msg}>{errors.telegram}</span>
              )}
            </div>

            <div className={cx(s.field, errors.email && s.error)}>
              <label>
                Email<span>*</span>
              </label>
              <input
                placeholder="example@mail.ru"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user?.email}
              />
              {errors.email && <span className={s.msg}>{errors.email}</span>}
              {user?.email && (
                <span className={s.helperText}>
                  Используется email из вашего профиля
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Поля для крипто обменов */}
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
                disabled={!!user?.email}
              />
              {errors.email && <span className={s.msg}>{errors.email}</span>}
              {user?.email && (
                <span className={s.helperText}>
                  Используется email из вашего профиля
                </span>
              )}
            </div>
          </>
        )}

        <button
          className={s.submit}
          disabled={
            loading || (verificationBlock && !verificationBlock.canProceed)
          }
        >
          {loading ? "Обработка..." : "Подтвердить"}
        </button>
      </form>

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

export default function ExchangePage() {
  return (
    <ProtectedRoute>
      <ExchangePageContent />
    </ProtectedRoute>
  );
}
