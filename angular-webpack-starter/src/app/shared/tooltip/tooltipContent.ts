import {Component, Input, AfterViewInit, ElementRef, ChangeDetectorRef} from "@angular/core";

@Component({
    selector: 'tooltip-content',
    template: `
        <div [style.display]="display" style="position: absolute; width: 100px; height: 100px; background-color: red;">
        {{ content }}
        </div>
    `
})
export class TooltipContent implements AfterViewInit {
    
    @Input()
    hostElment: HTMLElement;

    @Input()
    content: string;

    display: string;

    constructor(private element: ElementRef, private cdr: ChangeDetectorRef) {

    }

    ngAfterViewInit(): void {
        this.show();
        this.cdr.detectChanges();
    }

    show(): void {
        this.display = 'block';
    }

    hide(): void {
        this.display = 'none';
    } 
}