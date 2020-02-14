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
    console.log('Empty Atom Run');
  }

  async logExtend(startTime, isError = false) {
    const PPD_LOG_EXTEND = (this.envs.args || {})['PPD_LOG_EXTEND'] || false;
    if (PPD_LOG_EXTEND || isError) {
      await this.log({
        text: `⌛: ${new Date() - startTime} ms.`,
        level: 'timer',
        levelIndent: this.levelIndent + 1,
        extendInfo: true,
      });
      if (this.bindResults && Object.keys(this.bindResults).length) {
        await this.log({
          text: `↩️ (bR): ${JSON.stringify(this.bindResults)}`,
          levelIndent: this.levelIndent + 1,
          level: 'info',
          extendInfo: true,
        });
      }
      if (this.bindSelectors && Object.keys(this.bindSelectors).length) {
        await this.log({
          text: `📌☸️ (bS): ${JSON.stringify(this.bindSelectors)}`,
          levelIndent: this.levelIndent + 1,
          level: 'info',
          extendInfo: true,
        });
      }
      if (this.bindData && Object.keys(this.bindData).length) {
        await this.log({
          text: `📌📋 (bD): ${JSON.stringify(this.bindData)}`,
          levelIndent: this.levelIndent + 1,
          level: 'info',
          extendInfo: true,
        });
      }
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
    this._ = args._;
    this.name = args.name;
    this.description = args.description;
    this.socket = args.socket;

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
      await this.logExtend(startTime);
      return result;
    } catch (error) {
      await this.logExtend(startTime, true);

      const errorStrings = ['Error in Atom:', error.message, ...error.stack.split('\n')];
      await this.log({
        text: errorStrings.join('\n' + ' '.repeat(21) + ' | '.repeat(this.levelIndent + 1) + ' '),
        levelIndent: this.levelIndent + 1,
        level: 'error',
      });

      throw { message: `Error in Atom` };
    }
  }
}

module.exports = Atom;
