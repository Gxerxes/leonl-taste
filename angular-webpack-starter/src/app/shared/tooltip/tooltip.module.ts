import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {Tooltip} from "./tooltip";
import {TooltipContent} from "./tooltipContent";

export * from "./tooltip";
export * from "./tooltipContent";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        Tooltip,
        TooltipContent,
    ],
    exports: [
        Tooltip,
        TooltipContent,
    ],
    entryComponents: [
        TooltipContent
    ]
})
export class TooltipModule {

}