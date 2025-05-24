"use client";

import Image from "next/image";
import s from "@/styles/HistoryPage.module.scss";

const icons = {
  USDT: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg",
  ETH: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg",
  DOGE: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg",
};

const data = [
  {
    id: 1,
    from: 1000,
    fromCode: "USDT",
    to: 5974.31569,
    toCode: "DOGE",
    date: "11.03.2025",
    status: "pending",
  },
  {
    id: 2,
    from: 270,
    fromCode: "USDT",
    to: 0.13696624,
    toCode: "ETH",
    date: "10.03.2025",
    status: "success",
  },
  {
    id: 3,
    from: 270,
    fromCode: "USDT",
    to: 0.13696624,
    toCode: "ETH",
    date: "10.03.2025",
    status: "success",
  },
  {
    id: 4,
    from: 540,
    fromCode: "USDT",
    to: 0.270640035,
    toCode: "ETH",
    date: "09.03.2025",
    status: "cancel",
  },
  {
    id: 5,
    from: 270,
    fromCode: "USDT",
    to: 0.13696624,
    toCode: "ETH",
    date: "07.03.2025",
    status: "success",
  },
  {
    id: 6,
    from: 270,
    fromCode: "USDT",
    to: 0.13696624,
    toCode: "ETH",
    date: "07.03.2025",
    status: "success",
  },
];

const statusMap = {
  pending: { label: "Ожидается", color: "#ffb300" },
  success: { label: "Завершен", color: "#29b352" },
  cancel: { label: "Отменен", color: "#e53935" },
};

export default function HistoryPage() {
  return (
    <div className={s.wrap}>
      <h1 className={s.title}>История</h1>
      <ul className={s.list}>
        {data.map((item) => {
          const st = statusMap[item.status];
          return (
            <li key={item.id} className={s.card}>
              <div
                className={s.statusLine}
                style={{ backgroundColor: st.color }}
              />
              <div className={s.amountBlock}>
                <div className={s.row}>
                  <Image
                    src={icons[item.fromCode]}
                    width={20}
                    height={20}
                    alt=""
                  />
                  <span className={s.amount}>
                    {item.from} {item.fromCode}
                  </span>
                  <span className={s.arrow}>→</span>
                  <Image
                    src={icons[item.toCode]}
                    width={20}
                    height={20}
                    alt=""
                  />
                  <span className={s.amount}>
                    {item.to} {item.toCode}
                  </span>
                </div>
                <div className={s.meta}>
                  <span className={s.date}>{item.date}</span>
                  <span style={{ color: st.color }}>{st.label}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
