import {BaseSystem} from "./BaseSystem";
import {ComponentType} from "./Component";
import {ComponentStore} from "./ComponentStore";
import {Entity} from "./Entity";

interface ActiveEntity {
    entity: Entity;
    active: boolean;
}

export class ECS {
    public readonly componentStore: ComponentStore = new ComponentStore(
        this.initialPoolSize,
    );

    private entities: Map<number, ActiveEntity> = new Map();
    private entityIds: number[] = [];

    private systems: Map<
        number,
        BaseSystem<Array<ComponentType>, Array<ComponentType>>[]
    > = new Map();
    private systemPriorities: number[] = [];

    constructor(private readonly initialPoolSize: number = 2000) {
        for (let i = 0; i < this.initialPoolSize; i++) {
            this.entityIds.push(i);
            this.entities.set(i, {
                entity: new Entity(i, this.componentStore),
                active: false,
            });
        }
    }

    public update(deltaTimeMs: number) {
        for (const priority of this.systemPriorities) {
            for (const system of this.systems.get(priority) ?? []) {
                system.update(deltaTimeMs);
            }
        }
    }

    public addComponentType(componentType: ComponentType) {
        this.componentStore.registerComponentType(componentType);
    }

    public addComponentTypes(...componentTypes: ComponentType[]) {
        componentTypes.forEach((component) =>
            this.componentStore.registerComponentType(component),
        );
    }

    public addSystem<
        R extends Array<ComponentType>,
        E extends Array<ComponentType>,
    >(
        systemInit: BaseSystem<R, E> | (new (ecs: ECS) => BaseSystem<R, E>),
        priority = 0,
    ) {
        const system =
            systemInit instanceof BaseSystem
                ? systemInit
                : new systemInit(this);
        if (!this.systemPriorities.includes(priority)) {
            this.systemPriorities.push(priority);
            this.systemPriorities.sort();
        }

        const systems = this.systems.get(priority);
        if (!systems) {
            const newSystems = [system];
            this.systems.set(priority, newSystems);
        } else {
            systems.push(system);
        }
    }

    public finishRegistration() {
        this.componentStore.finishRegistration();
    }

    public createEntity(): Entity {
        const id = this.entityIds.pop();
        const newId = id ?? this.entities.size;
        if (id == undefined) {
            this.entities.set(newId, {
                entity: new Entity(newId, this.componentStore),
                active: false,
            });
        }
        const entity = this.entities.get(newId);
        if (!entity) {
            throw new Error(
                `Could not get an entity with ID ${id} -- something went wrong while retrieving it.`,
            );
        }
        if (entity.active) {
            throw new Error(
                `Got an active entity ID ${id} from the unused IDs.`,
            );
        }
        entity.active = true;
        return entity.entity;
    }

    public getEntity(id: number): Entity | undefined {
        const entity = this.entities.get(id);
        if (!entity) {
            return undefined;
        }
        if (!entity.active) {
            return undefined;
        }
        return entity.entity;
    }

    public deleteEntity(entityOrId: Entity | number) {
        const id = entityOrId instanceof Entity ? entityOrId.id : entityOrId;
        const entity = this.entities.get(id);
        if (!entity) {
            return;
        }
        entity.active = false;
        entity.entity.clear();
        this.entityIds.push(id);
    }
}
