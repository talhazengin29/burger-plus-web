import logoFull from "../assets/logo-full-transparent.png";
import "./BurgerPlusLogosu.css";

export default function BurgerPlusLogosu({ className = "", alt = "Burger Plus" }) {
  return (
    <span className={`burger-plus-logo ${className}`.trim()} role="img" aria-label={alt}>
      <img className="burger-plus-logo-taban" src={logoFull} alt="" aria-hidden="true" />
    </span>
  );
}
