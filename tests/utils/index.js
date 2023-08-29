function findAction(data, actionName) {
  // Вспомогательная рекурсивная функция для поиска действия
  function searchActionTraces(actionTraces) {
    for (const actionTrace of actionTraces) {
      // Проверка основного действия
      if (actionTrace.act.name === actionName) {
        return actionTrace.act.data; // Возвращаем data
      }

      // Проверка inline_traces, если они существуют
      if (actionTrace.inline_traces) {
        for (const inlineTrace of actionTrace.inline_traces) {
          if (inlineTrace.act.name === actionName) {
            return inlineTrace.act.data; // Возвращаем data
          }
          if (inlineTrace.inline_traces) {
            const found = searchActionTraces(inlineTrace.inline_traces);
            if (found) {
              return found; // Возвращаем data, найденное в рекурсивном вызове
            }
          }
        }
      }
    }
    return null;
  }

  // Инициализация поиска
  if (data?.processed?.action_traces) {
    return searchActionTraces(data.processed.action_traces);
  }

  return null; // Возврат null, если действие не найдено
}


module.exports = {findAction}