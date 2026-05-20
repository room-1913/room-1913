import Link from "next/link";
import { CHARACTERS, CharacterId } from "../characters";
import SessionRail from "../components/SessionRail";
import Portrait from "../components/Portrait";
import WindowDateChip from "../components/WindowDateChip";

const ORDER: CharacterId[] = ["jung", "freud", "adler", "lacan"];

export default function Landing() {
  return (
    <main className="archive-shell">
      <SessionRail active="session" />

      <section className="archive-stage">
        <header className="archive-stage-head">
          <h1 className="archive-stage-title font-serif">SESSION</h1>
          <p className="archive-stage-sub font-serif ink-fade">选择你的对话对象</p>
        </header>

        <ul className="dossier-list">
          {ORDER.map(id => {
            const c = CHARACTERS[id];
            return (
              <li key={id}>
                <Link href={`/room?with=${id}`} className="dossier">
                  <Portrait id={id} initial={c.initial ?? "·"} src={c.portrait} />
                  <div className="dossier-body">
                    <p className="dossier-name font-serif">{c.shortName ?? c.name}</p>
                    <p className="dossier-zh font-serif ink-fade">{c.zhName}</p>
                    <p className="dossier-role font-serif ink-fade">{c.schoolZh ?? c.school}</p>
                    <p className="dossier-place font-serif ink-mute">{c.place}</p>
                  </div>
                  <span className="dossier-arrow" aria-hidden>›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="archive-window">
        <WindowDateChip />
        <p className="window-quote font-serif italic">
          "What troubles you tonight?"
          <span className="window-quote-zh ink-fade font-serif">今晚，你想谈谈什么？</span>
        </p>
      </aside>
    </main>
  );
}
