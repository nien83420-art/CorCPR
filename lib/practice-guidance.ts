import type { Language } from "./types"

export const CADENCE_FRESH_MS = 2500
export const METRONOME_BPM = 110
export const METRONOME_MIN_BPM = 100
export const METRONOME_MAX_BPM = 120

export function currentCadence(bpm: number | null, updatedAt: number | null, now: number, available: boolean) {
  return available && bpm !== null && Number.isFinite(bpm) && bpm > 0 && updatedAt !== null
    && now >= updatedAt && now - updatedAt < CADENCE_FRESH_MS ? bpm : null
}

type GuidanceCopy = Record<"measured" | "unknown" | "below" | "inRange" | "above" | "metronome" | "metronomeNote" |
  "tempo" | "volume" | "mute" | "unmute" | "play" | "pause" | "audioError" | "skipCallHelp" |
  "posture" | "highlight" | "movement" | "exerciseGoal" | "exerciseLimit" | "targetCadence", string>

export const practiceGuidanceCopy: Record<Language, GuidanceCopy> = {
  ru: {
    skipCallHelp: "Пропустить жест звонка",
    measured: "Темп по камере", unknown: "Пока нет актуальной оценки темпа",
    below: "Ниже 100", inRange: "В диапазоне 100–120", above: "Выше 120",
    posture: "Держите локти прямыми, а плечи над кистями.",
    highlight: "Зелёная подсветка означает, что камера оценила этот элемент позы как подходящий.",
    movement: "Имитируйте нажатия движением корпуса, сохраняя локти прямыми.",
    exerciseGoal: "Учебные нажатия",
    exerciseLimit: "Это цель упражнения. При реальной СЛР счётчик не определяет, когда остановиться.",
    targetCadence: "Целевой темп",
    metronome: "Метроном", metronomeNote: "Один щелчок на одно нажатие. Это ориентир для ритма.",
    tempo: "Темп метронома", volume: "Громкость", mute: "Выключить звук", unmute: "Вернуть звук",
    play: "Включить метроном", pause: "Приостановить метроном", audioError: "Не удалось запустить звук. Попробуйте ещё раз.",
  },
  kk: {
    skipCallHelp: "Қоңырау шалу қимылын өткізіп жіберу",
    measured: "Камера бағалаған қарқын", unknown: "Қарқын туралы жаңа дерек жоқ",
    below: "100-ден төмен", inRange: "100–120 аралығында", above: "120-дан жоғары",
    posture: "Шынтақты тік ұстап, иықты қолдың үстіне келтіріңіз.",
    highlight: "Жасыл түс дене қалпының осы бөлігі талапқа сай көрінгенін білдіреді.",
    movement: "Шынтақты тік ұстап, денеңізбен басу қимылын жасаңыз.",
    exerciseGoal: "Оқу жаттығуындағы басулар",
    exerciseLimit: "Бұл — жаттығудың мақсаты. Шынайы ЖӨР кезінде санауыш қашан тоқтау керегін анықтамайды.",
    targetCadence: "Мақсатты қарқын",
    metronome: "Метроном", metronomeNote: "Бір дыбыс — бір басу. Дыбыс ырғақты ұстауға көмектеседі.",
    tempo: "Метроном қарқыны", volume: "Дыбыс деңгейі", mute: "Дыбысты өшіру", unmute: "Дыбысты қосу",
    play: "Метрономды қосу", pause: "Метрономды кідірту", audioError: "Дыбыс қосылмады. Қайта көріңіз.",
  },
  en: {
    skipCallHelp: "Skip the call gesture",
    measured: "Camera-estimated rate", unknown: "No current rate estimate",
    below: "Below 100", inRange: "In range 100–120", above: "Above 120",
    posture: "Keep your elbows straight and your shoulders above your hands.",
    highlight: "Green highlighting means that part of your posture appears to meet the exercise check.",
    movement: "Simulate compressions by moving your torso while keeping your elbows straight.",
    exerciseGoal: "Simulated compressions",
    exerciseLimit: "This is the exercise goal. In a real emergency, the count does not tell you when to stop CPR.",
    targetCadence: "Target rate",
    metronome: "Metronome", metronomeNote: "One click per intended compression. Use it as a rhythm reference.",
    tempo: "Metronome tempo", volume: "Volume", mute: "Mute", unmute: "Unmute",
    play: "Start metronome", pause: "Pause metronome", audioError: "Sound could not start. Try again.",
  },
}
