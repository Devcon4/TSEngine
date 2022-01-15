import { ECS } from "../base/ECS";
import { Position2D } from "../components/Position2D";
import { Velocity2D } from "../components/Velocity2D";
import { expectVector2CloseTo } from "../util/math/Vector2.test";
import { Vector2 } from "../util/math/Vector2";
import { VelocitySystem } from "./VelocitySystem";

describe(module.id, () => {
    it("should move entities appropriately", () => {
        const ecs = new ECS(1);

        ecs.addComponentType(Position2D);
        ecs.addComponentType(Velocity2D);

        ecs.addSystem(VelocitySystem);

        ecs.finishRegistration();

        const ent1 = ecs.createEntity();
        ent1.addComponentLiteral(Position2D, new Vector2(0, 0));
        ent1.addComponentLiteral(Velocity2D, new Vector2(1, 0));

        ecs.update(1000);
        const positionTick1 = ent1.getComponent(Position2D);
        expectVector2CloseTo(positionTick1, 1, 0);

        ecs.update(2000);
        const positionTick2 = ent1.getComponent(Position2D);
        expectVector2CloseTo(positionTick2, 3, 0);

        ecs.update(16.33);
        const positionTick3 = ent1.getComponent(Position2D);
        expectVector2CloseTo(positionTick3, 3.016, 0);
    });

});