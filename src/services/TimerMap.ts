type timerData = {timer: NodeJS.Timeout, timerEndTime: number }
export const gameTimer = new Map<string, timerData >();