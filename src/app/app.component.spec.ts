import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AppComponent } from './app.component';
import { AppService } from './app.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        AppService
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`country details box should have correct title`, () => {
    const scoreBox: HTMLElement = fixture.nativeElement.querySelector('.country-details');

    expect(scoreBox.textContent).toEqual(`Client's Risk Portfolio`);
  });
});
