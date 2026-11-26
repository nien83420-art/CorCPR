import type { Language } from "./types"

type CameraPreparationCopy = {
  title: string
  intro: string
  steps: [
    framing: [title: string, description: string],
    lighting: [title: string, description: string],
    space: [title: string, description: string],
  ]
  limits: string
  safePractice: string
  privacyTitle: string
  privacy: string
  results: string
  downloads: string
  permission: string
  start: string
}

export const cameraPreparationCopy: Record<Language, CameraPreparationCopy> = {
  ru: {
    title: "Подготовьтесь к тренировке",
    intro: "Проверьте положение перед камерой и начинайте практику.",
    steps: [
      ["Встаньте перед камерой", "Голова, плечи, руки и корпус до пояса должны быть видны."],
      ["Проверьте освещение", "Убедитесь, что камера хорошо видит ваши движения."],
      ["Освободите пространство", "Оставьте достаточно места для безопасных движений."],
    ],
    limits: "Камера оценивает движения и положение тела, но не измеряет реальную глубину или силу компрессий и не подтверждает медицинскую эффективность СЛР.",
    safePractice: "Имитируйте движения без нажатий на другого человека. Тренажёр дополняет очное обучение на манекене с инструктором.",
    privacyTitle: "Конфиденциальность камеры",
    privacy: "Кадры обрабатываются в браузере. Тренажёр не записывает видео, не сохраняет кадры и не отправляет их на сервер.",
    results: "При сохранении тренировки в аккаунт Supabase получает результаты: число повторов, оценку темпа, длительность и баллы.",
    downloads: "Для анализа позы браузер загружает модель и файлы MediaPipe из интернета.",
    permission: "Браузер запросит доступ к камере.",
    start: "Включить камеру и начать",
  },
  kk: {
    title: "Жаттығуға дайындалыңыз",
    intro: "Камера алдында дұрыс тұрғаныңызды тексеріп, жаттығуды бастаңыз.",
    steps: [
      ["Камера алдына тұрыңыз", "Басыңыз, иығыңыз, қолыңыз және денеңіздің белге дейінгі бөлігі кадрда көрінсін."],
      ["Жарықты тексеріңіз", "Қимылдарыңыз камерада анық көрінсін."],
      ["Айналаңызды босатыңыз", "Қауіпсіз қимылдауға жеткілікті орын қалдырыңыз."],
    ],
    limits: "Камера қимыл мен дене қалпын бағалайды, бірақ кеудені басудың нақты тереңдігі мен күшін өлшемейді және ЖӨР-дің медициналық тиімділігін растамайды.",
    safePractice: "Қимылды қайталаңыз, бірақ басқа адамның кеудесін баспаңыз. Жаттықтырғыш манекенмен және нұсқаушымен өтетін оқуды толықтырады.",
    privacyTitle: "Камера құпиялылығы",
    privacy: "Кадрлар браузерде өңделеді. Жаттықтырғыш видео жазбайды, кадрларды сақтамайды және серверге жібермейді.",
    results: "Жаттығуды аккаунтқа сақтағанда, қайталау саны, қарқын бағасы, ұзақтығы және ұпайлар Supabase-ке жіберіледі.",
    downloads: "Дене қалпын талдау үшін браузер MediaPipe моделі мен файлдарын интернеттен жүктейді.",
    permission: "Браузер камераны пайдалануға рұқсат сұрайды.",
    start: "Камераны қосып, бастау",
  },
  en: {
    title: "Get ready to practise",
    intro: "Check your position in front of the camera, then start practising.",
    steps: [
      ["Stand in front of the camera", "Keep your head, shoulders, arms, hands and torso down to your waist in view."],
      ["Check the lighting", "Make sure your movements are clearly visible on camera."],
      ["Clear some space", "Leave enough room to move safely."],
    ],
    limits: "The camera estimates movement and posture. It cannot measure actual compression depth or force or verify the clinical effectiveness of CPR.",
    safePractice: "Simulate the movements without pressing on another person. Use this trainer alongside supervised manikin practice.",
    privacyTitle: "Camera privacy",
    privacy: "Your browser processes the frames. The trainer does not record video, store frames or send them to a server.",
    results: "When you save training to an account, Supabase receives your results: repetition count, estimated rate, duration and scores.",
    downloads: "Your browser downloads the MediaPipe model and supporting files from the internet to analyse posture.",
    permission: "Your browser will ask for camera access.",
    start: "Enable camera and start",
  },
}
