import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as d3 from 'd3';
import { event as d3Event } from 'd3-selection';
import * as R from 'ramda';

import { AppService } from './app.service';

function getScoreColour(score: number | null, defaultColor = 'LightGray'): string {
  if (R.isNil(score) || Number.isNaN(score) || score > 10) {
    return defaultColor;
  }
  if (score <= 2.5) {
    return '#ce181f';
  }
  if (score <= 5) {
    return '#f47721';
  }
  if (score <= 7.5) {
    return '#ffc709';
  }
  return '#d6e040';
}

// TODO: Delete this function after the data will be correctly updated on backend side,
//       ISO_A2 for France & Norway were taken from https://country-code.cl/
function getCountryCode(code: string, name: string): string {
  if (code !== '-99') {
    return code;
  }
  if (name === 'France') {
    return 'FR';
  }
  if (name === 'Norway') {
    return 'NO';
  }
  return code;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'globe-demo';
  public countryDetails: string | undefined;

  private countryData;
  private readonly destroy$: Subject<void> = new Subject();

  constructor(private appService: AppService) {}

  public ngOnInit(): void {
    this.appService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(x => {
        this.countryData = x;
        this.loadGlobe();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadGlobe(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const sensitivity = 75;

    const projection = d3.geoOrthographic()
      .scale(400)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2]);


    const initialScale = projection.scale();
    let path = d3.geoPath().projection(projection);

    const svg = d3.select('#globe')
      .append('svg')
      .attr('width', width - 20)
      .attr('height', height - 20);

    const globe = svg.append('circle')
      .attr('fill', '#ADD8E6')
      .attr('stroke', '#000')
      .attr('stroke-width', '0.2')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', initialScale);

    svg.call(d3.drag().on('drag', () => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();
      projection.rotate([
        rotate[0] + d3Event.dx * k,
        rotate[1] - d3Event.dy * k
      ]);
      path = d3.geoPath().projection(projection);
      svg.selectAll('path').attr('d', path);
    }))
      .call(d3.zoom().on('zoom', () => {
        if (d3Event.transform.k > 0.3) {
          projection.scale(initialScale * d3Event.transform.k);
          path = d3.geoPath().projection(projection);
          svg.selectAll('path').attr('d', path);
          globe.attr('r', projection.scale());
        }
        else {
          d3Event.transform.k = 0.3;
        }
      }));

    const map = svg.append('g');

    d3.json('assets/ne_110m_admin_0_countries.json', (err, d) => {
      map.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(d.features)
        .enter().append('path')
        .attr('class', (d: any) => 'country_' + getCountryCode(d.properties.ISO_A2, d.properties.NAME))
        .attr('d', path)
        .attr('fill', (d: any) => getScoreColour(this.getCountryScore(getCountryCode(d.properties.ISO_A2, d.properties.NAME))))
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .on('mouseleave', () => this.clearDetails())
        .on('mouseover', (d: any) => this.showDetails(getCountryCode(d.properties.ISO_A2, d.properties.NAME), d.properties.NAME));
    });

  }

  private getCountryScore(countryCode: string): number | undefined {
    const country = this.countryData[countryCode];
    return country && country.entitled ? country.score : undefined;
  }

  private clearDetails(): void {
    this.countryDetails = undefined;
  }

  private showDetails(countryCode: string, countryName: string): void {
    const country = this.countryData[countryCode];
    if (!country || !country.entitled) {
      this.countryDetails = undefined;
      return;
    }
    this.countryDetails = `${countryName}: ${country.score.toFixed(2)}`;
  }
}
