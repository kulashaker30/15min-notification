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

  key = 'e67009f39dbc7643ba207648a629e415';
  token = '737e895614ca2ac691f367ea98dc8f0e1f8f1eb4197a330308fe1b136784caa1'; 

  public cards = [];
  public notifiedCards = [];
  public archives = [];

  constructor(public http: Http) {
    this.reloadCards();
    setInterval(()=> this.reloadCards(), 30000);
  }

  reloadCards() {
    console.log('Executing reloadCards...');
    
    if(localStorage.getItem('notifiedCards') != null) 
      this.notifiedCards = JSON.parse(localStorage.getItem('notifiedCards'));


    this.http.get('https://api.trello.com/1/boards/LON1agGF/cards?key=' + this.key + '&token=' + this.token)
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
          // Delete already notified cards
          let cardsToDelete = [];
          for(let i=0; i<=this.cards.length -1; i++)
            if(this.isCardNotified(this.cards[i]))
              cardsToDelete.push(this.cards[i]);

          cardsToDelete.forEach(c => {
            this.removeCardFromCards(c);
          });
          this.checkIfDueIn15mins();
        });  
  }

    checkIfDueIn15mins() {
      this.cards.forEach(card => {
          if(!this.isCardNotified(card)) 
          {
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
                this.triggerNotificationViaComment(card);
              }
              else {
                console.log(card.name + ' is still not due');
                this.removeCardFromNoticationCards(card);
              }
          }
      });
    }

    isCardNotified(card) {

      if(localStorage.getItem('notifiedCards') != undefined) {
        this.notifiedCards = JSON.parse(localStorage.getItem('notifiedCards'));
      }
      else {
        this.notifiedCards = [];
        localStorage.setItem('notifiedCards', JSON.stringify(this.notifiedCards));
      }

      if(this.notifiedCards.length > 0) {
        let temp = false;
        for(let i=0; i<=this.notifiedCards.length -1; i++) {
            if(this.notifiedCards[i].id == card.id && Date.parse(this.notifiedCards[i].due) == Date.parse(card.due)) {
              temp = true;
              break;
            }              
        }
        return temp;
      }
      else
        return false;
    }


    triggerNotificationViaComment(card: any) {
      this.http.post('https://api.trello.com//1/cards/' + card.shortLink + '/actions/comments',
      { 
        key: this.key,
        token: this.token,      
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

          if(this.notifiedCards.filter((c)=> { return c.id == card.id }).length == 1) {

              this.notifiedCards.filter((c)=> { return c.id == card.id })[0].due = card.due;
              this.notifiedCards.filter((c)=> { return c.id == card.id })[0].name = card.name;

          }
          else
            this.notifiedCards.push({ id: card.id, name: card.name, due: new Date(card.due)});
          
          this.removeCardFromCards(card);
          localStorage.setItem('notifiedCards', JSON.stringify(this.notifiedCards));
        });  
    }

    removeCardFromNoticationCards(card: any) {
        let index = -1;
        for(let i=0; i <= this.notifiedCards.length -1; i++) {
            if(card.id == this.notifiedCards[i].id) {
              index = i;
              break;
            }
        }

        if(index != -1) {
              this.notifiedCards.splice(index, 1);
          localStorage.setItem('notifiedCards', JSON.stringify(this.notifiedCards));
        }
    }

    removeCardFromCards(card: any) {
        let index = -1;
        for(let i=0; i <= this.cards.length -1; i++) {
          if(card.id == this.cards[i].id) {
            index = i;
            break;
          }
        }

        if(index != -1) {
          this.cards.splice(index, 1);
        }
    }

}
