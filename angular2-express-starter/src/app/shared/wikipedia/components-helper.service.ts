import {
    ApplicationRef, ComponentFactoryResolver, ComponentRef, Injectable, Injector, ReflectiveInjector, ViewContainerRef,
    ResolvedReflectiveProvider, Type
} from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

@Injectable()
export class ComponentsHelper {

    public constructor(private applicationRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver, private injector: Injector) {

    }

    public getDocument(): any {
        return this.injector.get(DOCUMENT);
    }

    public getRootViewContainerRef(): ViewContainerRef {
        const appInstance = this.applicationRef.components[0].instance;
        if (!appInstance.viewContainerRef) {
            const appName = this.applicationRef.componentTypes[0].name;
              throw new Error(`Missing 'viewContainerRef' declaration in ${appName} constructor`);
        }
        return appInstance.viewContainerRef;
    }

    public appendNextToLocation<T>(ComponentClass: Type<T>,
                                   location: ViewContainerRef,
                                   providers?: ResolvedReflectiveProvider[]): ComponentRef<T> {
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(ComponentClass);
        let parentInjector = location.parentInjector;
        let childInjector: Injector = parentInjector;
        if (providers && providers.length > 0) {
            childInjector = ReflectiveInjector.fromResolvedProviders(providers, parentInjector);
        }

        return location.createComponent(componentFactory, location.length, childInjector);

    }

    public appendNextToRoot<T>(ComponentClass: Type<T>,
                               ComponentOptionsClass: any,
                               options: any): ComponentRef<T> {
        let location = this.getRootViewContainerRef();
        let providers = ReflectiveInjector.resolve([
            {provide: ComponentOptionsClass, useValue: options}
        ]);
        return this.appendNextToLocation(ComponentClass, location, providers);
    }
}