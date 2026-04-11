# Chatbot Debugging Workflow

Этот документ фиксирует обязательный порядок дебага чат-бота. Любой новый баг в чате разбирается по этой схеме.

## 1. Зафиксировать сбой

Для каждого бага сначала сохраняем:
- точную реплику пользователя
- предыдущие 1-3 сообщения
- ожидаемое поведение
- фактическое поведение
- `action`, `flow`, `stage`, `pendingPrompt`, `triage`

Если баг найден в массовом прогоне, его краткая запись попадает в [bug.md](./bug.md).

## 2. Классифицировать баг

Каждый баг должен быть помечен одним основным типом:
- `misunderstanding` — бот неверно понял смысл сообщения
- `lost_context` — бот потерял контекст предыдущего шага
- `misroute` — интерпретация была приемлемой, но graph выбрал неверный путь
- `fallback_too_early` — бот слишком рано ушёл в общий fallback
- `tool_failure` — ошибка на уровне `availability/booking/cancel/handoff`
- `ui_contract` — backend отдал верный payload, но фронт неверно его использовал
- `copy_ux` — логика верна, но текст ответа неудачный

## 3. Определить слой поломки

Баг должен быть локализован в одном основном слое:
- [server/chat/domain.js](./server/chat/domain.js) — доменные сигналы, triage, topic/service detection
- [server/chat/interpreter.js](./server/chat/interpreter.js) — interpretation, pending continuation, heuristic understanding
- [server/chat/graph.js](./server/chat/graph.js) — приоритеты route и переходы flow
- [server/chat/tools](./server/chat/tools) — реальные side effects и deterministic execution
- [server/routes/chat.js](./server/routes/chat.js) — HTTP contract
- [src/hooks/useChat.ts](./src/hooks/useChat.ts) и карточки в [src/components/chat](./src/components/chat) — frontend transport/rendering

## 4. Минимально воспроизвести

Перед фиксом баг воспроизводится минимальным способом:
- один точный API-запрос или короткая цепочка
- отдельный `sessionId`
- без лишнего UI-шумa

При многошаговых сценариях использовать:
- [server/routes/chat.test.js](./server/routes/chat.test.js)
- [server/routes/chat-followup.test.js](./server/routes/chat-followup.test.js)
- [server/scripts/run-chat-simulations.mjs](./server/scripts/run-chat-simulations.mjs)

## 5. Сначала regression test, потом fix

Правило без исключений:
1. найден баг
2. добавлен тест
3. внесён фикс
4. тест стал зелёным

Тип теста выбирается так:
- `unit` — для чистых функций и детекторов
- `integration` — для `/api/chat`
- `simulation` — для длинного пользовательского диалога

## 6. Проверить trace решения

При разборе всегда нужно понять:
- какое сообщение пришло
- как оно было нормализовано
- что вернул `interpreter`
- какой `route` выбрал `graph`
- что вернул `tool`
- какой payload ушёл во фронт

Если это нельзя увидеть, сначала добавляется trace/logging, а потом правится логика.

## 7. Чинить только один слой за раз

Не править одновременно `domain`, `interpreter` и `graph`, если это не доказано трассировкой.

Предпочтительный порядок:
1. `domain`, если ошибка в распознавании сигнала
2. `interpreter`, если ошибка в продолжении сценария или нормализации смысла
3. `graph`, если ошибка в приоритете маршрутизации
4. `tools`, если ошибка в side effect
5. `frontend`, если backend уже верен

## 8. Обязательная проверка после фикса

После каждого фикса запускать:

```powershell
npm test -- --run server/routes/chat.test.js server/routes/chat-followup.test.js
node .\server\scripts\run-chat-simulations.mjs
```

Если менялся frontend contract, дополнительно:

```powershell
npm run build
```

## 9. Обновить bug log

После массового прогона:
- обновить [bug.md](./bug.md)
- кратко записать проблемы по каждому сбойному сценарию
- если баг закрыт, убедиться, что он больше не всплывает в следующем прогоне

## 10. Анти-паттерны

Запрещено:
- лечить баг только ручной проверкой в браузере
- чинить баг без regression test
- добавлять точечные фразы вместо обобщаемого паттерна, если это повторяющийся тип ошибки
- использовать generic fallback как "универсальный выход"

## Рабочий цикл

1. Поймать точный сбой
2. Пометить тип бага
3. Локализовать слой
4. Добавить regression test
5. Внести минимальный fix
6. Прогнать тесты
7. Прогнать массовые симуляции
8. Обновить [bug.md](./bug.md)

Этот workflow считается основным стандартом дебага для чат-бота.
