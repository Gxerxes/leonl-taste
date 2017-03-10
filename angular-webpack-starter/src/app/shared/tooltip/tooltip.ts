import {
    Directive, HostListener, ComponentRef, ViewContainerRef, Input, ComponentFactoryResolver,
    ComponentFactory
} from "@angular/core";
import {TooltipContent} from "./tooltipContent";

@Directive({
    selector: "[tooltip]"
})
export class Tooltip {

    private tooltip: ComponentRef<TooltipContent>;

    constructor(private ViewContainerRef: ViewContainerRef, private resolver: ComponentFactoryResolver) {

    }

    @Input("tooltip")
    content: string | TooltipContent;

    @HostListener('foscusin')
    @HostListener('mouseenter')
    show(): void {
        if (typeof this.content === 'string') {
            const factory = this.resolver.resolveComponentFactory(TooltipContent);
            
            this.tooltip = this.ViewContainerRef.createComponent(factory);
            this.tooltip.instance.hostElment = this.ViewContainerRef.element.nativeElement;
            this.tooltip.instance.content = this.content as string;
        } else {
            const tooltip = this.content as TooltipContent;
            tooltip.hostElment = this.ViewContainerRef.element.nativeElement;
            tooltip.show();
        }
    }

    @HostListener('focusout')
    @HostListener('mouseleave')
    hide(): void {
        if (this.tooltip) {
            this.tooltip.destroy();
        }

        if (this.content instanceof TooltipContent) {
            (this.content as TooltipContent).hide();
        }
    }
}