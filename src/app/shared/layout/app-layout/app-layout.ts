import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, Navbar, Footer],
    templateUrl: './app-layout.html',
    styleUrl: './app-layout.scss',
})
export class AppLayout { }