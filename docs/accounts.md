# Локальная разработка аккаунтов CorCpr

CorCpr использует Supabase Auth, серверные cookies Next.js и PostgreSQL. Для запуска приложения без настроенного Supabase доступен гостевой курс. На публичных страницах предусмотрены понятные сообщения о недоступности аккаунтов.

## Запуск

Используйте Node.js 24 и pnpm из поля `packageManager`. Источник версий зависимостей — `pnpm-lock.yaml`.

1. Выполните `pnpm install --frozen-lockfile`.
2. Запустите локальный Supabase из корня изолированного worktree. Для macOS на Apple Silicon проверена команда `env LC_ALL=C LANG=C pnpm dlx supabase@3.2.0 start --runtime native --preparation on-demand`. При наличии рабочего Docker можно выбрать `--runtime docker` для нового локального экземпляра.
3. Если локальный экземпляр уже запущен, примените новые миграции командой `pnpm dlx supabase@3.2.0 migration up --local`. Команды предназначены для локальной базы.
4. Скопируйте локальные значения API URL, Publishable Key и Secret Key в игнорируемый `.env.local` в переменные `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` и `SUPABASE_SECRET_KEY`. Сгенерируйте отдельный ключ для гостевого переноса командой `openssl rand -base64 32`. Серверный Secret Key и ключ шифрования остаются на сервере.
5. Выполните `pnpm dev --webpack --hostname 127.0.0.1 --port 3000` и откройте [локальное приложение](http://127.0.0.1:3000). Используйте один и тот же адрес для приложения и ссылок подтверждения, чтобы сохранить сессию браузера.
6. Письма находятся в Mailpit по адресу, выданному при запуске. Для локальной проверки используйте вымышленные адреса в домене `.test`.

Шаблоны подтверждения и восстановления передают одноразовый токен в серверный обработчик. Сессии в браузере ограничены HttpOnly cookies, сервер проверяет пользователя через Auth, а в базе действуют отдельные политики доступа. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Записи и права

- `user_profiles` хранит имя и дату разрешения доступа. Время регистрации и последнего входа берутся из Auth. Список инструктора содержит время входа только для назначенных учащихся, разрешивших просмотр.
- `account_roles`, `staff_invitations` и `staff_student_assignments` управляют ролями, приглашениями и назначениями. Обычная подтверждённая учётная запись получает права учащегося. Пользователь передаёт свой ID уполномоченному администратору. Администратор создаёт семидневное приглашение, которое получатель принимает в своём аккаунте. После принятия требуется TOTP MFA. Администратор может отзывать роль, приглашение и назначение. Доступы проверяются по актуальным строкам БД.
- Первого администратора назначает оператор базы для конкретного предварительно проверенного пользователя Auth. В локальном проекте оператор вставляет его реальный UUID и роль `admin` в `public.account_roles` через консоль владельца PostgreSQL. Перед выдачей полномочий оператор проверяет личность и подтверждение адреса. Привилегированные операции доступны только после подтверждения TOTP. [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa).
- `training_sessions` содержит UUID, тип, начало, последнюю активность и результат завершения. Счётчик активного времени учитывает видимую вкладку в фокусе. При закрытии или обновлении клиент отправляет отметку о прерывании, а периодические отметки сохраняют последнее известное время, если сеть недоступна. По прошествии двух минут без отметок открытая запись показывается как прерванная. Прохождение с незавершённого шага после перезагрузки начинается заново.
- `camera_training_results` хранит ранее рассчитанные приложением оценки и последнее доступное значение темпа. Видео, кадры и ориентиры позы не сохраняются. Оценки служат учебными показателями.
- `knowledge_assessment_attempts`, `knowledge_assessment_answers`, `self_assessments`, `learning_progress` и `initial_course_completions` хранят оценки отдельно от камеры. Для полного курса фиксируются вводные ответы, сценарии и упражнения, исход камеры, итоговая самооценка и проверенные ответы итогового теста. Обычный способ вручную завершить камеру доступен по прежнему сценарию, а недостающие оценки сохраняются пустыми. Для отдельной практики результат с числом нажатий ниже цели отмечается как прерванный.
- Гость может пройти полный маршрут до итогового теста. По его выбору результат шифруется в краткоживущей HttpOnly cookie браузера до 24 часов и привязывается к подтверждённому адресу. На другом устройстве нужно войти в аккаунт в исходном браузере до истечения срока. Транзакция привязывает один UUID к одному пользователю и сохраняет время завершения курса до регистрации.
- `account_deletion_requests` фиксирует запрос в кабинете администратора. Обработка и удаление остаются задачей уполномоченного оператора с проверкой личности и применимых сроков хранения.

## Проверки

- `pnpm exec tsc --noEmit --incremental false`
- `pnpm build --webpack`
- `pnpm test:auth` использует настоящий локальный Auth и Mailpit. Укажите `CORCPR_TEST_MAIL_URL` в локальном файле.
- `pnpm test:db` запускает транзакционные проверки pgTAP. Укажите `CORCPR_TEST_DB_URL` локального PostgreSQL. Если `psql` отсутствует в PATH, укажите путь к исполняемому файлу в `CORCPR_PSQL`.

Откройте главную и проверьте регистрацию и вход на трёх языках. Пройдите курс гостем, сохраните его и подтвердите почту в том же браузере. Войдите повторно и убедитесь, что тест и результат камеры показаны раздельно. Проверьте обязательность курса со вторым новым аккаунтом. Включите разрешение на просмотр у тестового ученика, назначьте инструктора с MFA, проверьте карточку, отзовите назначение и повторите запрос. Проверьте камеру и метроном вручную без реальных вызовов экстренных служб.

Для публичного запуска нужны отдельные разрешение и проверка. Согласуйте почтовый домен и доставку, лимиты Auth, порядок назначения и восстановления MFA, сроки хранения и удаление, применимые требования к согласию учащихся или родителей. До завершения этого этапа используйте только учебные данные без реальных персональных записей. [Проверка писем в локальном Supabase](https://supabase.com/docs/guides/auth/testing-auth-flows).

## Файлы изменения

- Вход, восстановление и сессии: `app/auth/page.tsx`, `app/auth/reset/page.tsx`, `app/auth/confirm/route.ts`, `proxy.ts`, `lib/accounts/server.ts`, `lib/accounts/account.ts`, `lib/accounts/auth-actions.ts`, `lib/accounts/mfa-actions.ts`, `components/accounts/account-shell.tsx`, `components/accounts/auth-form.tsx`, `components/accounts/account-forms.tsx`.
- Курс и сохранение: `app/page.tsx`, `app/api/training/activity/route.ts`, `components/screens/corcpr-app.tsx`, `components/screens/welcome-screen.tsx`, `components/screens/learning-screen.tsx`, `components/screens/course-results-flow.tsx`, `lib/course-results.ts`, `lib/accounts/actions.ts`, `lib/accounts/guest.ts`, `lib/accounts/training.ts`, `lib/accounts/use-training-clock.ts`. Возвращён ранее согласованный пропуск жеста звонка в `components/screens/cpr-practice-screen.tsx` и `lib/practice-guidance.ts`.
- Кабинеты и локализация: `app/account/page.tsx`, `app/staff/page.tsx`, `app/privacy/page.tsx`, `components/accounts/profile-forms.tsx`, `components/accounts/staff-management.tsx`, `components/accounts/training-report.tsx`, `lib/accounts/reporting.ts`, `lib/accounts/copy.ts`.
- База: `supabase/config.toml`, `supabase/supabase.lock`, `supabase/.gitignore`, `supabase/templates/confirm.html`, `supabase/templates/recovery.html`, `supabase/migrations/20261123000100_accounts.sql`, `supabase/migrations/20261123000200_training_writes.sql`, `supabase/migrations/20261123000300_reporting.sql`, `supabase/migrations/20261123000400_course_checkpoints.sql`, `supabase/migrations/20261123000500_staff_invitation_lock.sql`, `supabase/migrations/20261123000600_record_completion_time.sql`.
- Тесты и настройка: `supabase/tests/account_access.sql`, `tests/accounts-auth.test.mjs`, `tests/run-accounts-db.mjs`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `docs/accounts.md`. Настройки запущенного локального экземпляра находятся в игнорируемом `.env.local`.
