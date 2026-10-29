export default function Navbar({ activeView, onNavigate, cartCount, user, onLogout }) {
  const links = [
    { id: "shop", label: "Shop" },
    { id: "cart", label: `Cart (${cartCount})` },
    ...(user ? [{ id: "orders", label: "My orders" }] : []),
  ];

  return (
    <header className="site-header">
      <button className="brand-button" type="button" onClick={() => onNavigate("shop")}>
        <span className="brand-mark">S</span>
        <span>shoplite</span>
      </button>

      <nav className="main-nav" aria-label="Main navigation">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`nav-link ${activeView === link.id ? "active" : ""}`}
            aria-current={activeView === link.id ? "page" : undefined}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="account-area">
        {user ? (
          <>
            <span className="welcome-user">Hi, {user.name}</span>
            <button className="button button-quiet" type="button" onClick={onLogout}>Log out</button>
          </>
        ) : (
          <button className="button button-primary" type="button" onClick={() => onNavigate("auth")}>Log in</button>
        )}
      </div>
    </header>
  );
}
