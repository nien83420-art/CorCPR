import type { Language } from "./types"

export interface CourseCopy {
  title: string
  intro: string
  start: string
  practice: string
  beforePractice: string
  cameraTitle: string
  camera: string
  syllabus: string
  how: string
  stage: string
  back: string
  next: string
  home: string
  topics: readonly [string, string, string, string]
}

export const courseCopy: Record<Language, CourseCopy> = {
  en: {
    title: "Learn adult CPR",
    intro: "Learn what to do when someone has a sudden cardiac arrest: assess the scene, call emergency services and start cardiopulmonary resuscitation until help arrives.",
    start: "Start learning", practice: "Camera practice", beforePractice: "Review practice safety",
    cameraTitle: "Practising with your camera",
    camera: "Your camera estimates visible posture and cadence. Compression depth, force and clinical effectiveness cannot be verified by this trainer.",
    syllabus: "What you’ll learn", how: "Start with a short introduction and a four-question quiz.",
    stage: "Stage", back: "Previous", next: "Next", home: "Home",
    topics: ["Assess the scene and check responsiveness", "Call emergency services", "Hand and elbow position", "Compression rhythm"],
  },
  ru: {
    title: "Освойте основы СЛР у взрослых",
    intro: "Узнайте, как действовать при внезапной остановке сердца: оценить обстановку, вызвать скорую помощь и начать сердечно-лёгочную реанимацию до прибытия медиков.",
    start: "Начать обучение", practice: "Практика с камерой", beforePractice: "Безопасность перед практикой",
    cameraTitle: "Как работает практика с камерой",
    camera: "По видео тренажёр оценивает видимое положение тела и темп движений. Камера не позволяет подтвердить глубину и силу нажатий или клиническую эффективность СЛР.",
    syllabus: "Чему вы научитесь", how: "Начните с короткого введения и ответьте на четыре вопроса.",
    stage: "Этап", back: "Назад", next: "Далее", home: "На главную",
    topics: ["Оценка обстановки и проверка реакции", "Вызов скорой помощи", "Положение рук и локтей", "Ритм компрессий"],
  },
  kk: {
    title: "Ересектерге жүрек-өкпе реанимациясын жасауды үйреніңіз",
    intro: "Жүрек кенеттен тоқтағанда не істеу керегін үйреніңіз: жағдайды бағалау, жедел жәрдем шақыру және медицина қызметкерлері келгенше жүрек-өкпе реанимациясын бастау.",
    start: "Оқуды бастау", practice: "Камерамен жаттығу", beforePractice: "Қауіпсіздік ережелерін оқу",
    cameraTitle: "Камерамен жаттығу қалай өтеді?",
    camera: "Камера дененің көрінетін қалпы мен қимыл қарқынын бағалайды. Ол басу тереңдігін, күшін немесе реанимацияның клиникалық тиімділігін растай алмайды.",
    syllabus: "Нені үйренесіз?", how: "Қысқа кіріспеден бастап, төрт сұраққа жауап беріңіз.",
    stage: "Кезең", back: "Артқа", next: "Келесі", home: "Басты бетке",
    topics: ["Жағдайды бағалау және адамның реакциясын тексеру", "Жедел жәрдем шақыру", "Қол мен шынтақтың қалпы", "Кеуде қуысын басу ырғағы"],
  },
}
