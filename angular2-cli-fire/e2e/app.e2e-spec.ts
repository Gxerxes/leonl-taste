import { Angular2CliFirePage } from './app.po';

describe('angular2-cli-fire App', function() {
  let page: Angular2CliFirePage;

  beforeEach(() => {
    page = new Angular2CliFirePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
