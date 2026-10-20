import { SYLLABUS } from '../syllabus';
import { levelById } from '../levels';
import { useProgress } from '../core/progress';

export function Coverage() {
  const p = useProgress();
  return (
    <div className="panel wide">
      <div className="eyebrow">Proof of coverage</div>
      <h1>Syllabus map</h1>
      <p className="lede">
        Every line of the DTU Data Structures syllabus and the CS205 Design &amp; Analysis of Algorithms syllabus, with the levels that teach it.
      </p>
      {(['DS', 'DAA'] as const).map((c) => (
        <section key={c} className="lsec">
          <h2>{c === 'DS' ? 'Data Structures' : 'Design & Analysis of Algorithms (CS205)'}</h2>
          {SYLLABUS.filter((u) => u.course === c).map((u) => (
            <div key={u.unit} className="syl-unit">
              <h3>
                Unit {u.unit}: {u.title} <span className="muted">· {u.hours} h</span>
              </h3>
              <ul>
                {u.topics.map((t) => (
                  <li key={t.topic}>
                    <span>{t.topic}</span>
                    <span className="syl-links">
                      {t.levels.map((id) => {
                        const l = levelById(id);
                        return l ? (
                          <a key={id} href={`#/level/${id}`} className={`tag${p.levels[id]?.passed ? ' good' : ''}`}>
                            L{l.n} {l.title}
                          </a>
                        ) : (
                          <span key={id} className="tag dim">
                            {id}
                          </span>
                        );
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
