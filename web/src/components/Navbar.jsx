import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import s from "@/styles/Navbar.module.scss";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isActive = (path) => pathname === path;

  return (
    <nav className={s.nav}>
      <div className={s.container}>
        <Link href="/" className={s.logo}>
          <img src="/logo.svg" alt="Wirebit" />
        </Link>

        <div className={s.links}>
          <Link
            href="/"
            className={`${s.link} ${isActive("/") ? s.active : ""}`}
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/exchange"
            className={`${s.link} ${isActive("/exchange") ? s.active : ""}`}
          >
            {t("nav.exchange")}
          </Link>
          <Link
            href="/rates"
            className={`${s.link} ${isActive("/rates") ? s.active : ""}`}
          >
            {t("nav.rates")}
          </Link>
        </div>

        <div className={s.auth}>
          <LanguageSwitcher />
          {user ? (
            <Link
              href="/profile"
              className={`${s.authLink} ${
                isActive("/profile") ? s.active : ""
              }`}
            >
              {t("nav.profile")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`${s.authLink} ${
                  isActive("/login") ? s.active : ""
                }`}
              >
                {t("common.login")}
              </Link>
              <Link
                href="/register"
                className={`${s.authLink} ${
                  isActive("/register") ? s.active : ""
                }`}
              >
                {t("common.register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
