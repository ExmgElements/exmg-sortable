export const promisifyFlush = (flush: Function) => () => new Promise(resolve => flush(resolve));
