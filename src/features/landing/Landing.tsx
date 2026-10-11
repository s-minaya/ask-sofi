import { useId, useState, type Ref } from 'react'
import { PhotoBooth } from '../../components/sofi/PhotoBooth/PhotoBooth'
import {
  SofiDialog,
  SofiDialogText,
} from '../../components/sofi/SofiDialog/SofiDialog'
import { Burst } from '../../components/ui/Burst/Burst'
import { Button } from '../../components/ui/Button/Button'
import { Logo } from '../../components/ui/Logo/Logo'
import {
  SoundChoice,
  type SoundChoiceValue,
} from '../../components/ui/SoundChoice/SoundChoice'
import { KickerRow } from '../../components/ui/Tag/Tag'
import { ThemeSwitch } from '../../components/ui/ThemeSwitch/ThemeSwitch'
import { Ticker } from '../../components/ui/Ticker/Ticker'
import styles from './Landing.module.scss'

const HEADLINES = [
  'Un «no pasa nada» no siempre significa que no pase nada',
  'Sofi confirma: el contexto lo cambia todo',
  'Ninguna lectura es una sentencia',
]

type LandingProps = {
  // «Empezar» es el gesto que prepara el audio si se ha elegido sonido.
  onStart: (sound: SoundChoiceValue) => void
  headingRef?: Ref<HTMLHeadingElement>
  mainId?: string
}

export function Landing({ onStart, headingRef, mainId }: LandingProps) {
  const [sound, setSound] = useState<SoundChoiceValue>('off')
  const headlineId = useId()

  return (
    <>
      <Ticker label="Última hora" headlines={HEADLINES} />
      <header className={styles.mast}>
        <h1 className={styles.mastLogo}>
          <Logo
            alt="Ask Sofi"
            className={styles.logo}
            sizes="(min-width: 99.3125em) 33.75em, (min-width: 36.8125em) 34vw, 12.5em"
          />
        </h1>
        <div className={styles.mastSide}>
          <div className={styles.issue}>
            <p className={styles.issueKicker}>Nº 001 · Otoño 2026</p>
            <p className={styles.issueLine}>
              El consultorio más cotilla de internet
            </p>
          </div>
          <Burst
            kicker="Consulta"
            size={118}
            rotate={10}
            kickerSize={10}
            mainSize={34}
            className={styles.headBurst}
          >
            0&nbsp;€
          </Burst>
          <ThemeSwitch display="responsive" />
        </div>
      </header>
      <main id={mainId} tabIndex={-1}>
        <div className={styles.hero}>
          <section className={styles.copy} aria-labelledby={headlineId}>
            <KickerRow tag="Exclusiva" kicker="Sofi lo cuenta todo" />
            <h2
              id={headlineId}
              ref={headingRef}
              tabIndex={-1}
              className={styles.headline}
            >
              ¿Qué ha querido decir con{' '}
              <span className={styles.nowrap}>
                <span className={styles.hit}>«vale»</span>?
              </span>
            </h2>
            <p className={styles.deck}>
              Sofi lee entre líneas y te cuenta todas las versiones de la
              historia que se sostienen, cada una con su porcentaje. Sin
              sentencias.
            </p>
            <SoundChoice
              value={sound}
              onChange={setSound}
              className={styles.sound}
            />
            <div className={styles.cta}>
              <Button size="lg" arrow onClick={() => onStart(sound)}>
                Empezar
              </Button>
              <p className={styles.ctaNote}>
                Gratis · Sin registro · Código abierto
              </p>
            </div>
          </section>
          <div className={styles.booth}>
            <div className={styles.boothDots} aria-hidden="true" />
            <PhotoBooth />
            <Burst
              kicker="Consulta"
              size={84}
              rotate={12}
              kickerSize={8}
              mainSize={24}
              className={styles.boothBurst}
            >
              0&nbsp;€
            </Burst>
          </div>
          <SofiDialog size="md" className={styles.quote}>
            <SofiDialogText as="blockquote">
              Con un «vale» no hago milagros. Dame contexto.
            </SofiDialogText>
          </SofiDialog>
        </div>
        <section className={styles.boxes} aria-label="Así trabaja Sofi">
          <div className={styles.boxPink}>
            <p className={styles.boxKicker}>01 · Las versiones</p>
            <p className={styles.boxTitle}>
              Todas las versiones de la historia.
            </p>
            <p className={styles.boxText}>
              Nunca una sola sentencia: te enseño cada lectura que se sostiene.
            </p>
          </div>
          <div className={styles.boxButter}>
            <p className={styles.boxKicker}>02 · Los porcentajes</p>
            <p className={styles.boxTitle}>Con su letra pequeña.</p>
            <p className={styles.boxText}>
              El porcentaje mide el apoyo de cada lectura, no lo que siente tu
              pareja.
            </p>
          </div>
          <div className={styles.boxInk}>
            <p className={styles.boxKicker}>03 · El contexto</p>
            <p className={styles.boxTitle}>Si falta un dato, te lo pido.</p>
            <p className={styles.boxText}>
              Pedir más contexto también es una respuesta. Y a veces, la mejor.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
