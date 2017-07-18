import { Component } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  public cards = [];
  public notifiedCards = [];

  constructor(public http: Http) {
    this.reloadCards();
    setInterval(()=> this.reloadCards(), 30000);
  }

  reloadCards() {
    console.log('Executing reloadCards...');
    this.http.get('https://api.trello.com/1/boards/9ZOtFb4L/cards?key=e67009f39dbc7643ba207648a629e415&token=737e895614ca2ac691f367ea98dc8f0e1f8f1eb4197a330308fe1b136784caa1')
      .map(
        (response: Response) => { 
            let data = response.json();
            return data.filter(function(c) {               
              c.due = new Date(c.due)
              return c.due != null && new Date(c.due) > new Date();
            });
        }
      )
      .subscribe(
        cards => this.cards = cards, 
        error => console.log('Error has occured: ' + error),
        () => 
        { 
          this.checkIfDueIn15mins();
        });  
  }

  checkIfDueIn15mins() {

    this.cards.forEach(card => {

      let currentDate: any = new Date();
      let cardDueDate: any = new Date(card.due)
      let isDueDate: any = false;
      if(currentDate < cardDueDate) {
        isDueDate = cardDueDate - currentDate <= 900000;
      }
      else {
        isDueDate = false;
      }

      if(isDueDate) {
        console.log(card.name + ' is now due');
        // call triggerNotificationViaComment
        this.saveNotifiedCard(card);
      }
      else {
        console.log(card.name + ' is still not due');
      }
    });

  }

  saveNotifiedCard(card: any) {

    if(localStorage.getItem('notifiedCards') != undefined) {
      this.notifiedCards = JSON.parse(localStorage.getItem('notifiedCards'));
    }
    if(this.notifiedCards.filter((nc) => { return nc.id == card.id }).length == 0) {
      this.triggerNotificationViaComment(card);
    }

    this.cards = this.cards.filter((c) => { return c.id != card.id});
    
  }

  triggerNotificationViaComment(card: any) {
    this.http.post('https://api.trello.com//1/cards/' + card.shortLink + '/actions/comments',
      { 
        key: 'e67009f39dbc7643ba207648a629e415', 
        token: '737e895614ca2ac691f367ea98dc8f0e1f8f1eb4197a330308fe1b136784caa1', 
        text: '@card This task is due in 15 minutes.' 
      })
      .map(
        (response: Response) => { 
          console.log('Response: ' +  response);
        }
      )
      .subscribe(
        cards => console.log(cards),
        error => console.log('Error has occured: ' + error),
        () => {
          this.notifiedCards.push({ id: card.id, name: card.name, due: new Date(card.due)});
          localStorage.setItem('notifiedCards', JSON.stringify(this.notifiedCards));
        });  
  }


}
