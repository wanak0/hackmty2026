import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  HeartHandshake,
  MessageCircle,
  ReceiptText,
  Wallet,
  Check,
  ShieldCheck,
} from "lucide-react";
import { BanorteLogo } from "../common/BanorteLogo";

interface LandingPageProps {
  onStartDemo: () => void;
}

export function LandingPage({ onStartDemo }: LandingPageProps) {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <div className="institutional-strip">
        <div className="page-width">
          <span>GRUPO FINANCIERO BANORTE</span>
          <span>Prototipo · HackMTY 2026</span>
        </div>
      </div>
      <header className="site-header">
        <div className="page-width header-inner">
          <BanorteLogo size="lg" />
          <nav aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <button className="button primary" onClick={onStartDemo}>
              Entrar a la demo <ArrowRight size={18} />
            </button>
          </nav>
        </div>
      </header>
      <main id="contenido">
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> BANCA QUE TE ENTIENDE
            </p>
            <h1>
              Tu dinero,
              <br />
              <span>más claro.</span>
              <br />
              Tu banco, más cerca.
            </h1>
            <p className="hero-description">
              Dinos qué necesitas. Te ayudamos a consultar, organizar y dar el
              siguiente paso con tu dinero.
            </p>
            <button className="button primary hero-cta" onClick={onStartDemo}>
              Comenzar con Maya <ArrowRight size={20} />
            </button>
            <p className="hero-note">
              <ShieldCheck size={17} /> Pruébalo con datos de ejemplo, sin
              dinero real.
            </p>
          </div>
          <div
            className="hero-visual"
            aria-label="Ejemplo ilustrativo de una consulta con Maya"
          >
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="preview-account">
              <div className="preview-account-top">
                <BanorteLogo variant="white" size="sm" />
                <span>MI CUENTA</span>
              </div>
              <p>Todo empieza con tranquilidad.</p>
              <div className="preview-account-bottom">
                <span>Enlace Digital</span>
                <span>•••• 4092</span>
              </div>
              <div className="card-stripes" aria-hidden="true" />
            </div>
            <div className="preview-message">
              <span className="preview-avatar">Tú</span>
              <p>¿En qué gasté este mes?</p>
              <Check size={18} />
            </div>
            <div className="preview-response">
              <div className="preview-response-title">
                <span className="maya-icon">
                  <MessageCircle size={21} />
                </span>
                <div>
                  <strong>Maya</strong>
                  <span>Vamos a verlo juntos</span>
                </div>
                <span className="example-label">Ejemplo</span>
              </div>
              <h2>Tus gastos, de un vistazo</h2>
              <p>Así se distribuyen tus compras.</p>
              <div
                className="sample-chart"
                aria-label="Distribución ilustrativa: despensa, compras y servicios"
              >
                <div>
                  <span>Despensa</span>
                  <i style={{ width: "85%" }} />
                  <span>Más frecuente</span>
                </div>
                <div>
                  <span>Compras</span>
                  <i style={{ width: "62%" }} />
                </div>
                <div>
                  <span>Servicios</span>
                  <i style={{ width: "38%" }} />
                </div>
              </div>
              <button onClick={onStartDemo}>
                Consultar mis movimientos <ArrowRight size={18} />
              </button>
            </div>
            <div className="visual-caption">
              <span /> Una pregunta. Una pantalla hecha para ti.
            </div>
          </div>
        </section>
        <section
          className="task-section page-width"
          aria-labelledby="tasks-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">LO QUE NECESITAS, A LA MANO</p>
              <h2 id="tasks-title">Menos vueltas. Más soluciones.</h2>
            </div>
            <span>Empieza por lo que importa hoy.</span>
          </div>
          <div className="landing-tasks">
            {[
              {
                icon: Wallet,
                title: "Consultar mi saldo",
                text: "Conoce cuánto tienes disponible.",
              },
              {
                icon: CreditCard,
                title: "Organizar mis pagos",
                text: "Explora opciones para tu tarjeta.",
              },
              {
                icon: ReceiptText,
                title: "Entender mis gastos",
                text: "Ve a dónde se va tu dinero.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <button key={title} onClick={onStartDemo}>
                <Icon size={27} strokeWidth={1.6} />
                <h3>{title}</h3>
                <p>{text}</p>
                <ArrowUpRight className="task-arrow" size={21} />
              </button>
            ))}
          </div>
        </section>
        <section className="how-section" id="como-funciona">
          <div className="page-width how-inner">
            <div className="how-intro">
              <HeartHandshake size={32} strokeWidth={1.5} />
              <h2>
                A tu ritmo.
                <br /> Paso a paso.
              </h2>
              <p>
                No necesitas saber de tecnología.
                <br />
                Solo decir qué necesitas.
              </p>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h3>Cuéntanos con tus palabras</h3>
                  <p>Escribe una pregunta o elige una de las opciones.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Revisa todo con claridad</h3>
                  <p>
                    Maya prepara una pantalla con la información que necesitas.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Tú decides el siguiente paso</h3>
                  <p>Consulta, ajusta los datos y revisa antes de continuar.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="site-footer page-width">
        <BanorteLogo size="sm" />
        <p>
          Propuesta para el reto Banorte × Tec de Monterrey
          <br />
          <span>HackMTY 2026 · Demostración con datos sintéticos</span>
        </p>
      </footer>
    </div>
  );
}
