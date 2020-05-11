const path = require('path');

class AtomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AtomError';
  }
}

class Atom {
  constructor() {}

  async getElement(page, selector, allElements = false) {
    if (page && selector && typeof selector === 'string' && typeof page === 'object') {
      let element;
      if (selector.startsWith('xpath:')) {
        selector = selector.replace(/^xpath:/, '');
        element = await page.$x(selector);
        if (!allElements) {
          if (element.length > 1) {
            throw { message: `Find more then 1 xpath elements ${selector}` };
          }
          element = element[0];
        }
      } else {
        selector = selector.replace(/^css:/, '');
        element = allElements ? await page.$$(selector) : await page.$(selector);
      }
      return element;
    } else {
      return false;
    }
  }

  async atomRun() {
    throw new AtomError('Empty Atom Run');
  }

  async logStack(error) {
    error.stack = error.stack || '';
    const errorStrings = [error.message, ...error.stack.split('\n')];
    await this.log({
      text: 'Error in Atom:',
      levelIndent: this.levelIndent + 1,
      level: 'error',
      extendInfo: true,
    });
    for (let i = 0; i < errorStrings.length; i++) {
      await this.log({
        text: errorStrings[i],
        levelIndent: this.levelIndent + 2,
        level: 'error',
        extendInfo: true,
      });
    }
  }

  async logSpliter() {
    await this.log({
      text: '='.repeat(120 - (this.levelIndent + 1) * 3 - 21),
      levelIndent: this.levelIndent + 1,
      level: 'error',
      extendInfo: true,
    });
  }

  async logTimer(startTime, isError = false) {
    const PPD_LOG_EXTEND = (this.envs.args || {})['PPD_LOG_EXTEND'] || false;
    if (PPD_LOG_EXTEND || isError) {
      await this.log({
        text: `⌛: ${new Date() - startTime} ms.`,
        level: isError ? 'error' : 'timer',
        levelIndent: this.levelIndent + 1,
        extendInfo: true,
      });
    }
  }

  async logExtend(isError = false) {
    const PPD_LOG_EXTEND = (this.envs.args || {})['PPD_LOG_EXTEND'] || false;
    if (PPD_LOG_EXTEND || isError) {
      const dataSources = [
        ['📌📋 (bD):', this.bindData],
        ['📋 (data):', this.dataTest],
        ['☸️ (selectors):', this.selectorsTest],
        ['📌☸️ (bS):', this.bindSelectors],
        ['↩️ (bR):', this.bindResults],
        ['⚙️ (options):', this.options],
      ].filter(v => typeof v[1] === 'object' && Object.keys(v[1]).length);

      for (let i = 0; i < dataSources.length; i++) {
        const [text, object] = dataSources[i];
        await this.log({
          text: `${text} ${JSON.stringify(object)}`,
          levelIndent: this.levelIndent + 1,
          level: isError ? 'error' : 'info',
          extendInfo: true,
        });
      }
    }
  }

  async logDebug() {
    if (this.data && Object.keys(this.data).length) {
      const dataDebug = JSON.stringify(this.data, null, 2).split('\n');
      await this.log({
        text: '📋 (All Data):',
        levelIndent: this.levelIndent + 1,
        level: 'error',
        extendInfo: true,
        stdOut: false,
      });
      for (let i = 0; i < dataDebug.length; i++) {
        await this.log({
          text: dataDebug[i],
          levelIndent: this.levelIndent + 2,
          level: 'error',
          extendInfo: true,
          stdOut: false,
        });
      }
    }
    if (this.selectors && Object.keys(this.selectors).length) {
      const selectorsDebug = JSON.stringify(this.selectors, null, 2).split('\n');
      await this.log({
        text: '☸️ (All Selectors):',
        levelIndent: this.levelIndent + 1,
        level: 'error',
        extendInfo: true,
        stdOut: false,
      });
      for (let i = 0; i < selectorsDebug.length; i++) {
        await this.log({
          text: selectorsDebug[i],
          levelIndent: this.levelIndent + 2,
          level: 'error',
          extendInfo: true,
          stdOut: false,
        });
      }
    }
  }

  async logArgs() {
    const args = Object.entries(this.envs.args);
    await this.log({
      text: 'Arguments:',
      levelIndent: this.levelIndent + 1,
      level: 'error',
      extendInfo: true,
      stdOut: false,
    });
    for (let i = 0; i < args.length; i++) {
      const [key, val] = args[i];
      await this.log({
        text: `${key}: ${JSON.stringify(val)}`,
        levelIndent: this.levelIndent + 2,
        level: 'error',
        extendInfo: true,
        stdOut: false,
      });
    }
  }

  async runTest(args = {}) {
    const startTime = new Date();

    this.envs = args.envs;
    this.envsId = args.envsId;
    this.envName = args.envName;
    this.envPageName = args.envPageName;
    this.data = args.data;
    this.selectors = args.selectors;
    this.options = args.options;
    this.allowResults = args.allowResults;
    this.bindResults = args.bindResults;
    this.levelIndent = args.levelIndent;
    this.repeat = args.repeat;
    this.stepId = args.stepId;
    this.env = args.env;
    this.browser = args.browser;
    this.page = args.page;
    this.name = args.name;
    this.description = args.description;
    this.socket = args.socket;
    this.debug = args.debug;

    this.dataTest = args.dataTest;
    this.selectorsTest = args.selectorsTest;

    this.bindResults = args.bindResults;
    this.bindSelectors = args.bindSelectors;
    this.bindData = args.bindData;

    this.screenshot = (this.options || {})['screenshot'] || false;
    this.fullpage = (this.options || {})['fullpage'] || false;
    this.level = (this.options || {})['level'] || 'raw';
    this.log = async function(customLog) {
      await args.log({
        ...{
          screenshot: this.screenshot,
          fullpage: this.fullpage,
          level: this.level,
          levelIndent: this.levelIndent + 1,
        },
        ...customLog,
      });
    };

    try {
      const result = await this.atomRun();
      await this.logTimer(startTime);
      await this.logExtend();
      return result;
    } catch (error) {
      const outputFile = path.join(this.envs.output.folderFull, 'output.log');
      await this.log({
        text: `Extend information you can reached in log file: \u001B[42mfile:///${outputFile}\u001B[0m`,
        levelIndent: this.levelIndent + 1,
        level: 'error',
        extendInfo: true,
      });

      await this.logSpliter();
      await this.logTimer(startTime, true);
      await this.logExtend(true);
      await this.logDebug();
      await this.logArgs();
      await this.logStack(error);
      await this.logSpliter();

      throw new AtomError('Error in Atom');
    }
  }
}

module.exports = Atom;
