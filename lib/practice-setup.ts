import type { Language } from "./types"

type Step = [title: string, summary: string, ...guides: string[]]
type SetupCopy = {
  steps: [Step, Step, Step, Step, Step, Step, Step]
  levels: [string, string][]
  back: string
  next: string
  start: string
  standing: string
  kneeling: string
  play: string
  pause: string
}

export const practiceSetup: Record<Language, SetupCopy> = {
  ru: {
    steps: [
      ["Чему вы научитесь", "CorCpr помогает отработать движения при СЛР у взрослых.", "Положение корпуса", "Положение рук", "Ритм нажатий"],
      ["Как вы оцениваете свой опыт?", "Выберите ближайший вариант. Это самооценка для подготовки к практике."],
      ["Настройте камеру", "Сначала встаньте перед камерой, затем займите положение для СЛР. Сравните оба кадра.", "В кадре видны голова, корпус до пояса и кисти.", "Освободите место для движений и направьте свет на себя."],
      ["Примите устойчивую позу", "Встаньте на колени сбоку от манекена.", "Плечи прямо над кистями", "Локти выпрямлены", "Ладонь на ладони, пальцы сцеплены", "Перенесите вес тела над грудной клеткой"],
      ["Найдите точку для нажатий", "Поставьте основание ладони по центру груди, на нижнюю половину грудины.", "Линия между сосками — приблизительный ориентир. Точку определяйте по грудине.", "Вторую ладонь положите сверху и сцепите пальцы."],
      ["Нажимайте и полностью отпускайте", "В этой тренировке цель — 30 нажатий в ритме 100–120 в минуту.", "Давите вертикально вниз.", "Дайте груди полностью расправиться. Кисти остаются на месте."],
      ["Готовы к тренировке?", "Камера включится после нажатия «Начать тренировку».", "Проверьте свет и видимость головы, корпуса и кистей.", "Займите положение для СЛР. Держите плечи над кистями и локти прямыми.", "CorCpr даёт учебные подсказки по видимой позе, положению рук и ритму. Камера не измеряет глубину и силу нажатий и не подтверждает эффективность СЛР.", "Практикуйтесь на учебном манекене. Тренажёр дополняет очное обучение."],
    ],
    levels: [["Никогда не практиковал(а)", "Начинаю с основ."], ["Знаю только теорию", "Знаком(а) с действиями, хочу попробовать движения."], ["Уже практиковал(а)", "Хочу освежить навык и проверить положение тела."], ["Чувствую себя уверенно", "Хочу повторить движения в нужном ритме."]],
    back: "Назад", next: "Продолжить", start: "Начать тренировку", standing: "Стоя", kneeling: "В положении для СЛР", play: "Показать движение", pause: "Пауза",
  },
  en: {
    steps: [
      ["What you’ll learn", "CorCpr helps you rehearse adult CPR movements.", "Body posture", "Hand position", "Compression rhythm"],
      ["How much experience do you have?", "Choose whichever fits best. This is a quick self-assessment before practice."],
      ["Set up your camera", "Stand in front of the camera, then move into CPR position. Compare both views.", "Keep your head, torso down to the waist, and hands in view.", "Make room to move and light yourself from the front."],
      ["Get into position", "Kneel beside the training manikin.", "Shoulders directly above hands", "Straight elbows", "Hands stacked, fingers interlocked", "Body weight over the chest"],
      ["Find the hand position", "Place the heel of one hand in the centre of the chest, on the lower half of the breastbone.", "The line between the nipples is an approximate landmark. Use the breastbone to find the spot.", "Place your other hand on top and interlock your fingers."],
      ["Press down and release fully", "This exercise targets 30 compressions at 100–120 per minute.", "Push straight down.", "Let the chest return fully. Keep your hands in place."],
      ["Ready to practise?", "The camera starts when you choose Start practice.", "Check the lighting and keep your head, torso and hands visible.", "Get into CPR position, with shoulders above hands and elbows straight.", "CorCpr gives training feedback on visible posture, hand position and rhythm. The camera cannot measure compression depth or force or verify CPR effectiveness.", "Practise on a training manikin. This exercise supplements hands-on training."],
    ],
    levels: [["I’ve never practised", "I’m starting with the basics."], ["I only know the theory", "I know the steps and want to try the movements."], ["I’ve practised before", "I want to refresh my technique and check my position."], ["I feel confident", "I want to rehearse the movement and rhythm."]],
    back: "Back", next: "Continue", start: "Start practice", standing: "Standing", kneeling: "In CPR position", play: "Show movement", pause: "Pause",
  },
  kk: {
    steps: [
      ["Нені үйренесіз?", "CorCpr ересектерге жүрек-өкпе реанимациясын жасау қимылдарын жаттықтыруға көмектеседі.", "Дене қалпы", "Қолдың орны", "Басу ырғағы"],
      ["Тәжірибеңізді қалай бағалайсыз?", "Өзіңізге сай жауапты таңдаңыз. Бұл жаттығу алдындағы қысқа өзіндік бағалау."],
      ["Камераны баптаңыз", "Алдымен камера алдында тұрыңыз, кейін ЖӨР қалпына көшіңіз. Екі көріністі салыстырыңыз.", "Бас, белге дейінгі дене және қолдар кадрда көрінсін.", "Қимылдауға орын қалдырып, жарықты алдыңыздан түсіріңіз."],
      ["Дұрыс қалыпқа келіңіз", "Манекеннің жанына тізерлеңіз.", "Иықтар қолдың дәл үстінде", "Шынтақтар түзу", "Бір алақан екіншісінің үстінде, саусақтар айқасқан", "Дене салмағы кеуде тұсында"],
      ["Қол қоятын орынды табыңыз", "Алақанның түбін кеуде ортасына, төс сүйегінің төменгі жартысына қойыңыз.", "Екі емізіктің арасындағы сызық — шамамен алынған бағдар. Нақты нүктені төс сүйегіне қарап табыңыз.", "Екінші алақанды үстіне қойып, саусақтарды айқастырыңыз."],
      ["Басыңыз да, толық босатыңыз", "Жаттығу мақсаты — минутына 100–120 ырғақпен 30 рет басу.", "Тік төмен қарай басыңыз.", "Кеуде толық жазылсын. Қолды орнынан жылжытпаңыз."],
      ["Жаттығуға дайынсыз ба?", "«Жаттығуды бастау» түймесін басқанда камера қосылады.", "Жарықты тексеріңіз. Бас, дене және қол көрініп тұрсын.", "ЖӨР қалпына келіңіз. Иық қолдың үстінде, шынтақтар түзу болсын.", "CorCpr көрінетін дене қалпы, қолдың орны мен ырғақ бойынша оқу кеңесін береді. Камера басудың тереңдігі мен күшін өлшемейді және ЖӨР тиімділігін растамайды.", "Оқу манекенінде жаттығыңыз. Бұл құрал тәжірибелік оқуды толықтырады."],
    ],
    levels: [["Бұрын жаттығып көрмедім", "Негіздерінен бастаймын."], ["Тек теорияны білемін", "Қадамдарды білемін, қимылдарды жасап көргім келеді."], ["Бұрын жаттықтым", "Дағдымды жаңартып, дене қалпымды тексергім келеді."], ["Өзіме сенімдімін", "Қимылдар мен ырғақты қайталағым келеді."]],
    back: "Артқа", next: "Жалғастыру", start: "Жаттығуды бастау", standing: "Тік тұрған қалып", kneeling: "ЖӨР қалпы", play: "Қимылды көрсету", pause: "Кідірту",
  },
}

export interface PlacementCopy {
  hint: string
  diagram: string
  marker: string
  check: string
  retry: string
  correct: string
  incorrect: string
}

interface VisualCopy {
  framing: [string[], string[]]
  placement: PlacementCopy
  rhythm: [string, string, string, string]
}

export const visualSetup: Record<Language, VisualCopy> = {
  ru: {
    framing: [
      ["Встаньте перед камерой. В кадре должны быть видны голова, кисти и корпус до пояса.", "Освободите место для движений и направьте свет на себя."],
      ["Встаньте на колени сбоку от манекена. Выпрямите локти и расположите плечи над кистями.", "Убедитесь, что верхняя часть тела и кисти остаются в кадре."],
    ],
    placement: {
      hint: "Перетащите зелёную метку или коснитесь нужного места. С клавиатуры перемещайте метку стрелками.",
      diagram: "Схема грудной клетки взрослого", marker: "Метка точки нажатия", check: "Проверить", retry: "Попробовать снова",
      correct: "Верно. Основание ладони находится по центру груди, на нижней половине грудины.",
      incorrect: "Метка за пределами нужной зоны. Пунктир показывает нижнюю половину грудины. Попробуйте снова.",
    },
    rhythm: ["100–120 нажатий в минуту", "5–6 см — учебный ориентир глубины для взрослого", "30 нажатий в цикле стандартной СЛР 30:2", "Давайте груди полностью расправиться. Сведите паузы к минимуму."],
  },
  en: {
    framing: [
      ["Stand in front of the camera with your head, hands and torso down to the waist visible.", "Clear room to move and light yourself from the front."],
      ["Kneel beside the manikin. Straighten your elbows and align shoulders above hands.", "Keep your upper body and hands within the frame."],
    ],
    placement: {
      hint: "Drag the green marker or tap a spot. On a keyboard, move the marker with the arrow keys.",
      diagram: "Illustration of an adult chest", marker: "Compression point marker", check: "Check", retry: "Try again",
      correct: "Correct. The heel of the hand is in the centre of the chest on the lower half of the breastbone.",
      incorrect: "Outside the target. The dashed outline shows the lower half of the breastbone. Try again.",
    },
    rhythm: ["100–120 compressions per minute", "5–6 cm is the adult CPR training target for depth", "30 compressions per cycle in conventional 30:2 CPR", "Allow full chest recoil and minimise interruptions."],
  },
  kk: {
    framing: [
      ["Камера алдына тұрыңыз. Бас, қол және белге дейінгі дене кадрда көрінсін.", "Қимылдауға орын қалдырып, жарықты алдыңыздан түсіріңіз."],
      ["Манекеннің жанына тізерлеңіз. Шынтақты түзеп, иықты қолдың үстіне келтіріңіз.", "Дененің жоғарғы бөлігі мен қолдар кадрда көрініп тұрсын."],
    ],
    placement: {
      hint: "Жасыл белгіні сүйреңіз немесе қажетті орынды түртіңіз. Пернетақтада белгіні көрсеткі пернелерімен жылжытыңыз.",
      diagram: "Ересек адамның кеуде сызбасы", marker: "Басу нүктесінің белгісі", check: "Тексеру", retry: "Қайталап көру",
      correct: "Дұрыс. Алақанның түбі кеуде ортасында, төс сүйегінің төменгі жартысында.",
      incorrect: "Белгі қажетті аймақтан тыс тұр. Үзік сызық төс сүйегінің төменгі жартысын көрсетеді. Қайта көріңіз.",
    },
    rhythm: ["Минутына 100–120 рет басу", "5–6 см — ересек адамның кеудесін басу тереңдігінің оқу бағдары", "Дәстүрлі 30:2 ЖӨР циклінде 30 рет басу", "Кеуде толық жазылсын. Үзілісті барынша азайтыңыз."],
  },
}
