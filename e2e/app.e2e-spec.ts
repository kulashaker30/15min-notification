import { TrelloCustomPage } from './app.po';

describe('trello-custom App', () => {
  let page: TrelloCustomPage;

  beforeEach(() => {
    page = new TrelloCustomPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
