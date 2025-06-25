// SwapInfoCard.jsx
import React from 'react';
import styles from './SwapInfoCard.module.css';

export default function SwapInfoCard({ data = {} }) {
  // Деструктурируем и задаём дефолты, скопированные из вашего примера
  const {
    url = 'https://wirebit.net/hst_p6ff7jqbmnb8uw8usbwshy4gc69s80derru/',
    id = 2053,
    hash = 'p6ff7jqbmnb8uw8usbwshy4gc69s80derru',
    status = 'new',
    status_title = 'Как оплатить',
    psys_give = 'TRON',
    psys_get = 'Ethereum',
    currency_code_give = 'TRX',
    currency_code_get = 'ETH',
    amount_give = '2000',
    amount_get = '0.22139009',
    course_give = '8993.20648685',
    course_get = '1',
    api_actions: {
      type = 'address',
      cancel = 'disabled',
      pay = 'disabled',
      pay_amount = '2000',
      instruction = `<h2>Произведите оплату на выданные реквизиты</h2>
<div class="textblock">
  <div class="text">
    <h3>
      <span class="js_copy pn_copy" data-clipboard-text="TFodR4uLgYNfZBQummJJyebchku78TC2Gj">
        TFodR4uLgYNfZBQummJJyebchku78TC2Gj
      </span>
      <span class="break_words"></span>
      <p>
        <span class="js_copy pn_copy" data-clipboard-text="2000">2000</span> TRX
      </p>
    </h3>
  </div>
</div>
<div className={styles.qr}>
  <img 
    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TFodR4uLgYNfZBQummJJyebchku78TC2Gj"
    title="TFodR4uLgYNfZBQummJJyebchku78TC2Gj"
    alt="TFodR4uLgYNfZBQummJJyebchku78TC2Gj"
  />
</div>
<ul></ul>
<h3>
  Средства проверяются через AML. Максимальный процент удержания средств по обменам,
  не прошедших AML проверку составляет 10%
</h3>`,
      address = 'TFodR4uLgYNfZBQummJJyebchku78TC2Gj',
      dest_tag = '',
    } = {},
  } = data;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{status_title}</h2>

      <div className={styles.row}>
        <span className={styles.label}>Отдаёте:</span>
        <span className={styles.value}>
          {amount_give} {currency_code_give}
        </span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Получаете:</span>
        <span className={styles.value}>
          {amount_get} {currency_code_get}
        </span>
      </div>

      {/* Инструкция из API (или её дефолт) */}
      {instruction && (
        <div
          className={styles.instruction}
          dangerouslySetInnerHTML={{ __html: instruction }}
        />
      )}

    </div>
  );
}
