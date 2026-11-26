import type { Language } from "./types"

function words(en: string, ru: string, kk: string): Record<Language, string> {
  return { en, ru, kk }
}

export const controls = {
  step: words("Step", "Шаг", "Қадам"),
  play: words("Play", "Воспроизвести", "Ойнату"),
  pause: words("Pause", "Пауза", "Кідірту"),
  replay: words("Replay step", "Повторить шаг", "Қадамды қайталау"),
  previous: words("Previous step", "Предыдущий шаг", "Алдыңғы қадам"),
  next: words("Next step", "Следующий шаг", "Келесі қадам"),
  car: words("Moving traffic", "Движущийся автомобиль", "Қозғалып келе жатқан көлік"),
  wire: words("Live cable", "Оголённый провод", "Ашық электр сымы"),
  hazardsFound: words("Both hazards found. Keep clear until the area is safe.", "Обе опасности найдены. Дождитесь, пока место станет безопасным.", "Екі қауіп те табылды. Айнала қауіпсіз болғанша жақындамаңыз."),
  selected: words("Stay clear. Look for the other hazard.", "Держитесь на расстоянии. Найдите вторую опасность.", "Жақындамаңыз. Екінші қауіпті табыңыз."),
  connected: words("Training dispatcher connected. Say where you are and that the adult is unresponsive.", "Учебный диспетчер на связи. Сообщите место и скажите, что взрослый не реагирует.", "Оқу диспетчері байланыста. Мекенжайды және ересек адамның жауап бермейтінін айтыңыз."),
  speaker: words("Enable speakerphone", "Включить громкую связь", "Динамикті қосу"),
  speakerOn: words("Speaker on. Assess breathing while following the dispatcher’s instructions.", "Громкая связь включена. Оцените дыхание и следуйте указаниям диспетчера.", "Динамик қосылды. Тынысын бағалап, диспетчердің нұсқауын орындаңыз."),
  call: words("Simulate call", "Учебный звонок", "Оқу қоңырауы"),
  normal: words("Normal breathing", "Нормальное дыхание", "Қалыпты тыныс"),
  gasp: words("Occasional gasps", "Редкие судорожные вздохи", "Сирек қырылдап дем алу"),
  correct: words("Shoulders over hands", "Плечи над руками", "Иық қолдың үстінде"),
  bent: words("Bent elbows", "Согнутые локти", "Шынтақ бүгілген"),
  responsive: words("Responds", "Реагирует", "Жауап береді"),
  silent: words("Unresponsive", "Не реагирует", "Жауап бермейді"),
  trained: words("Trained and willing", "Обучен и готов делать вдохи", "Үйренгенмін және дайынмын"),
  only: words("Compression-only", "Только нажатия", "Тек кеудені басу"),
  source: words("Guidance", "Источники", "Дереккөздер"),
}

export const sequence = [
  ["hazards", "approach", "tap", "response"],
  ["call", "breathing", "gasp", "bystander", "aed"],
  ["kneel", "hands", "alignment", "press"],
  ["airway", "barrier", "breaths", "resume"],
] as const

export type Scene = (typeof sequence)[number][number]
export const captions: Record<Scene, ReturnType<typeof words>> = {
  hazards: words("Select two hazards in the scene. Also check for gas and falling objects.", "Отметьте две опасности на рисунке. Учитывайте также утечку газа и падающие предметы.", "Суреттегі екі қауіпті белгілеңіз. Газдың шығуы мен құлайтын заттарды да ескеріңіз."),
  approach: words("The area is now safe. Approach the adult and kneel beside them.", "Теперь место безопасно. Подойдите к человеку и встаньте рядом на колени.", "Енді айнала қауіпсіз. Адамға жақындап, жанына тізерлеңіз."),
  tap: words("Ask loudly if they are OK. Gently tap their shoulders and look for a response.", "Громко спросите, всё ли в порядке. Осторожно постучите по плечам и проверьте реакцию.", "Дауыстап халін сұраңыз. Иықтарын ақырын қағып, жауап бар-жоғын тексеріңіз."),
  response: words("Compare both responses. What would you do if they do not respond?", "Сравните обе реакции. Что делать, если человек не реагирует?", "Екі реакцияны салыстырыңыз. Адам жауап бермесе, не істейсіз?"),
  call: words("No response. Call immediately. Try the simulated Kazakhstan ambulance (103) or emergency service (112), then switch to speakerphone.", "Человек не реагирует. Сразу вызовите помощь. В симуляторе выберите скорую (103) или единую экстренную службу Казахстана (112), затем включите громкую связь.", "Адам жауап бермейді. Бірден көмек шақырыңыз. Симуляторда Қазақстанның жедел жәрдемін (103) не бірыңғай шұғыл қызметін (112) таңдап, динамикті қосыңыз."),
  breathing: words("While the call connects, open the airway and check for normal breathing for up to 10 seconds. Look, listen and feel. A lay rescuer need not check a pulse.", "Пока идёт соединение, откройте дыхательные пути. До 10 секунд смотрите на грудь, слушайте и ощущайте дыхание. Очевидцу не нужно проверять пульс.", "Қоңырау қосылып жатқанда тыныс жолын ашыңыз. Кеудеге қарап, тынысын тыңдап, сезіңіз. Бұған 10 секундтан асырмаңыз. Куәгерге тамыр соғысын тексеру қажет емес."),
  gasp: words("Compare a regular rise and fall with isolated gasps separated by long pauses. What should you do if the unresponsive adult is only gasping?", "Сравните равномерное дыхание и отдельные судорожные вздохи с паузами. Что делать, если человек не реагирует и лишь изредка вздыхает?", "Бірқалыпты тынысты ұзақ үзілістері бар сирек дем алумен салыстырыңыз. Жауап бермейтін адам тек қырылдап дем алса, не істейсіз?"),
  bystander: words("Address one person directly. Ask them to fetch an AED and, if help has not been called, to call emergency services. Start CPR promptly for absent or abnormal breathing.", "Обратитесь к конкретному очевидцу. Попросите принести АНД и вызвать помощь, если её ещё не вызвали. При отсутствии нормального дыхания немедленно начните СЛР.", "Бір адамға нақты тапсырма беріңіз. Дефибрилляторды әкелуді және әлі шақырылмаса, жедел жәрдем шақыруды сұраңыз. Қалыпты тыныс болмаса, ЖӨР-ді дереу бастаңыз."),
  aed: words("Switch on the AED. Apply pads to the bare chest as pictured on the pads. Follow its voice prompts. Stand clear during analysis and any shock, then resume CPR when prompted.", "Включите АНД. Наклейте электроды на обнажённую грудь по рисункам на них. Следуйте голосовым подсказкам. Во время анализа и разряда никто не касается человека. По команде возобновите СЛР.", "Дефибрилляторды қосыңыз. Электродтарды өздеріндегі суретке сай жалаңаш кеудеге жапсырыңыз. Дауыстық нұсқауды орындаңыз. Талдау мен разряд кезінде ешкім адамға тимесін. Нұсқау бойынша ЖӨР-ді жалғастырыңыз."),
  kneel: words("Kneel beside the adult. Use a firm, flat surface when feasible without delaying compressions.", "Встаньте на колени сбоку. По возможности используйте твёрдую ровную поверхность без задержки нажатий.", "Адамның жанына тізерлеңіз. Басуды кешіктірмей, мүмкін болса қатты, тегіс бетті пайдаланыңыз."),
  hands: words("Place the heel of one hand in the centre of the chest on the lower half of the breastbone. Place the other hand on top and interlock your fingers.", "Поставьте основание ладони в центр груди на нижнюю половину грудины. Положите сверху вторую ладонь и сцепите пальцы.", "Бір алақанның түбін кеуденің ортасына, төс сүйегінің төменгі жартысына қойыңыз. Екінші қолды үстіне қойып, саусақтарды айқастырыңыз."),
  alignment: words("Compare the two positions. Which lets the rescuer use body weight?", "Сравните два положения. Какое позволяет использовать вес тела?", "Екі қалыпты салыстырыңыз. Қай қалыпта дене салмағын қолдануға болады?"),
  press: words("With straight elbows, use your body weight to press and release. Aim for 100–120/min and 5–6 cm in an adult. Allow full recoil and minimise interruptions. Depth here is an educational diagram. The camera cannot measure it.", "С прямыми локтями используйте вес тела. Цель для взрослого — 100–120 нажатий в минуту на глубину 5–6 см. Давайте груди полностью расправиться и сокращайте паузы. Глубина показана на схеме. Камера её не измеряет.", "Шынтақты тік ұстап, дене салмағымен басыңыз. Ересектерге арналған бағдар — минутына 100–120 рет, тереңдігі 5–6 см. Кеуде толық жазылсын, үзілісті азайтыңыз. Сызбадағы тереңдікті камера өлшемейді."),
  airway: words("After 30 compressions, trained and willing rescuers can give two breaths. Open the airway with head tilt and chin lift. Never sweep the mouth blindly with your fingers.", "После 30 нажатий обученный и готовый к этому человек может сделать два вдоха. Откройте дыхательные пути запрокидыванием головы и подъёмом подбородка. Не очищайте рот пальцами вслепую.", "30 басудан кейін үйренген әрі дайын адам екі рет тыныс бере алады. Басты шалқайтып, иекті көтеріп тыныс жолын ашыңыз. Ауызды саусақпен көрмей тазаламаңыз."),
  barrier: words("If a pocket mask is available and you know how to use it, cover the nose and mouth, hold a seal and breathe through its valve.", "Если есть карманная маска и вы умеете ею пользоваться, накройте нос и рот, обеспечьте плотное прилегание и вдыхайте через клапан.", "Қалта маскасы бар әрі оны қолдануды білсеңіз, мұрын мен ауызды жауып, масканы тығыз ұстап, клапан арқылы дем беріңіз."),
  breaths: words("Watch the demonstration. Give each breath over about one second, just enough for visible chest rise. Let the chest fall between breaths. Avoid excessive ventilation.", "Проследите за грудной клеткой. Каждый вдох длится около секунды, до видимого подъёма груди. Между вдохами дайте груди опуститься. Избегайте избыточной вентиляции.", "Кеуденің көтерілуін бақылаңыз. Әр тынысты шамамен бір секунд, кеуде сәл көтерілгенше беріңіз. Арасында кеуде төмендесін. Шамадан тыс ауа бермеңіз."),
  resume: words("Choose the route that fits the rescuer. Watch how compressions resume with minimal interruption.", "Выберите вариант для спасателя. Посмотрите, как он возвращается к нажатиям с минимальной паузой.", "Көмек көрсетушіге сай жолды таңдаңыз. Кеудені басудың қысқа үзілістен кейін жалғасуын бақылаңыз."),
}

export const exercise = {
  respondHelp: words("Stay with them, ask what happened and seek help as needed.", "Оставайтесь рядом, спросите, что произошло, и при необходимости вызовите помощь.", "Жанында қалып, не болғанын сұраңыз және қажет болса көмек шақырыңыз."),
  noResponse: words("There is no purposeful response. Choose your next action.", "Осмысленной реакции нет. Выберите следующее действие.", "Саналы жауап жоқ. Келесі әрекетті таңдаңыз."),
  callNow: words("Call for help now", "Сразу вызвать помощь", "Дереу көмек шақыру"),
  wait: words("Wait for them to wake", "Подождать пробуждения", "Оянғанын күту"),
  callReason: words("Activate emergency services promptly. Use speakerphone to check breathing with the dispatcher’s guidance.", "Сразу свяжитесь с экстренной службой. Включите громкую связь и оценивайте дыхание по указаниям диспетчера.", "Шұғыл қызметке дереу хабарласыңыз. Динамикті қосып, диспетчер нұсқауымен тынысын бағалаңыз."),
  waitReason: words("Waiting could delay help. An unresponsive adult needs an immediate emergency call.", "Ожидание задерживает помощь. Если взрослый не реагирует, сразу вызовите экстренную службу.", "Күту көмекті кешіктіреді. Ересек адам жауап бермесе, дереу шұғыл қызметті шақырыңыз."),
  watch: words("Wait and observe", "Подождать и понаблюдать", "Бақылап күту"),
  cpr: words("Start CPR", "Начать СЛР", "ЖӨР бастау"),
  gaspingReason: words("Gasps are abnormal breathing. With an unresponsive adult, start CPR promptly and follow the dispatcher.", "Судорожные вздохи — ненормальное дыхание. Если взрослый не реагирует, начните СЛР и следуйте указаниям диспетчера.", "Қырылдап сирек дем алу қалыпты тыныс емес. Ересек адам жауап бермесе, ЖӨР бастап, диспетчер нұсқауын орындаңыз."),
  normalReason: words("Regular chest rise and fall. If unresponsive but breathing normally, monitor breathing and follow the dispatcher.", "Грудь равномерно поднимается и опускается. Если сознания нет, но дыхание нормальное, следите за ним и выполняйте указания диспетчера.", "Кеуде бірқалыпты көтеріліп, түседі. Ессіз адамның тынысы қалыпты болса, оны бақылап, диспетчер нұсқауын орындаңыз."),
  bentReason: words("Here the elbows bend and the shoulders sit behind the hands. Move the shoulders over the hands and straighten the arms.", "Локти согнуты, плечи позади кистей. Перенесите плечи над кистями и выпрямите руки.", "Шынтақ бүгілген, иық қолдың артында. Иықты қолдың үстіне келтіріп, қолды түзетіңіз."),
  alignedReason: words("Straight arms and shoulders above the hands let body weight drive the movement.", "Прямые руки и плечи над кистями позволяют использовать вес тела.", "Қолды түзу ұстап, иықты оның үстіне келтіру дене салмағын қолдануға мүмкіндік береді."),
  cycles: words("After two breaths, resume compressions. Continue cycles of 30 compressions and 2 breaths.", "После двух вдохов сразу вернитесь к нажатиям. Продолжайте циклами по 30 нажатий и 2 вдоха.", "Екі тыныстан кейін бірден басуды жалғастырыңыз. 30 басу мен 2 тынысты кезектестіріңіз."),
  continuous: words("If untrained or unwilling to give breaths, use continuous chest compressions for adult sudden cardiac arrest.", "Если вы не обучены вдохам или не готовы их делать, при внезапной остановке сердца у взрослого выполняйте непрерывные нажатия.", "Тыныс беруді үйренбеген не оған дайын болмасаңыз, ересектің жүрегі кенет тоқтағанда кеудені үздіксіз басыңыз."),
}
