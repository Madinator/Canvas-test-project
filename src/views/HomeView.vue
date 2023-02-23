<script lang="ts" setup>
import { reactive, ref } from "vue";
import { KonvaEventObject } from "konva/types/Node";
import { DoublyLinkedList } from "@/helpers/utils";
import { LineT, BlockT, ActionE } from "@/helpers/typings";

const width = window.innerWidth;
const height = window.innerHeight;

const startCircleGroupPosition = {
  x: 200,
  y: 80,
};
const endCircleGroupPosition = {
  x: 0,
  y: 20,
};

const block1 = reactive({
  stageSize: {
    width: width,
    height: height,
    attrs: {
      background: "green",
    },
  },
  dragStopFlag: false,
  isConnected: false,
  groupConfig: {
    X: 100,
    Y: 100,
  },
  rectConfig: {
    Width: 200,
    Height: 100,
    Color: "white",
    stroke: "#555",
    strokeWidth: 1,
  },
  textConfig: {
    text: "Text message",
    fill: "black",
    fontSize: 20,
  },
  circleConfig: {
    fill: "gray",
    width: 20,
    height: 20,
    x: startCircleGroupPosition.x,
    y: startCircleGroupPosition.y,
  },
  lineConfig: {
    stroke: "red",
    strokeWidth: 3,
    lineCap: "round",
    lineJoin: "round",
    tension: 0.5,
  },
  isPaint: false,
});
const block2 = reactive({
  groupConfig: {
    X: 400,
    Y: 550,
    fill: "black",
  },
  rectConfig: {
    Width: 200,
    Height: 100,
    Color: "white",
    stroke: "#555",
    strokeWidth: 1,
  },
  textConfig: {
    text: "Text message",
    fill: "black",
    fontSize: 20,
  },
  circleConfig: {
    fill: "gray",
    width: 20,
    height: 20,
    x: endCircleGroupPosition.x,
    y: endCircleGroupPosition.y,
  },
});

const linePoints = ref([0, 0]);
const scale = ref(1);

const history = ref<DoublyLinkedList<LineT | BlockT>>(new DoublyLinkedList());

history.value.add({
  id: "quadLinePath",
  isConnected: block1.isConnected,
  x: undefined,
  y: undefined,
});
history.value.add({
  id: "block1",
  x: block1.groupConfig.X,
  y: block1.groupConfig.Y,
  isConnected: undefined,
});
history.value.add({
  id: "block2",
  x: block2.groupConfig.X,
  y: block2.groupConfig.Y,
});

const currentItem = ref(history.value.getLast());

const stageRef = ref();

const handleOnCircle = (event: KonvaEventObject<MouseEvent>) => {
  //check is on circle or not
  if (event.target.id() === "startCircle") {
    block1.dragStopFlag = true;
  } else {
    block1.dragStopFlag = false;
  }
};
const handleDrag = (event: KonvaEventObject<DragEvent>) => {
  //doesn't drag on circle
  if (block1.dragStopFlag) {
    event.target.stopDrag();
  }
  updateLine(ActionE.DRAG);
};
const handleDragend = (event: KonvaEventObject<DragEvent>) => {
  const item = {
    id: event.target.id(),
    x: event.target.x(),
    y: event.target.y(),
  };

  if (item.id === "block1") {
    block1.groupConfig.X = item.x;
    block1.groupConfig.Y = item.y;
  }
  if (item.id === "block2") {
    block2.groupConfig.X = item.x;
    block2.groupConfig.Y = item.y;
  }

  if (currentItem.value && currentItem.value.next) {
    history.value.addAfter(currentItem.value, item);
  } else {
    history.value.add(item);
  }
  currentItem.value = history.value.getLast();
};

const startDraw = (event: KonvaEventObject<MouseEvent>) => {
  if (event.target.id() === "startCircle") {
    block1.isPaint = true;
    if (block1.isConnected) {
      linePoints.value = [];
    }
    const stage = stageRef.value.getStage();
    const pos = stage.getPointerPosition();
    //set x1, y1
    linePoints.value[0] = zoomNumberByX(pos.x);
    linePoints.value[1] = zoomNumberByY(pos.y);
  }
};
const drawing = (event: KonvaEventObject<MouseEvent>) => {
  if (!block1.isPaint) {
    return;
  }
  event.evt.preventDefault();
  const stage = stageRef.value.getStage();
  const pos = stage.getPointerPosition();
  //set x2, y2
  const zoomedValues = getZoomedPoints(
    linePoints.value[0],
    linePoints.value[1],
    pos.x,
    pos.y
  );
  linePoints.value = curveLine(
    zoomedValues[0],
    zoomedValues[1],
    zoomedValues[2],
    zoomedValues[3]
  );
  //update draw
  stageRef.value.getStage().batchDraw();
};
const stopDraw = (event: KonvaEventObject<MouseEvent>) => {
  if (block1.isPaint) {
    if (event.target.id() === "endCircle") {
      block1.isConnected = true;
      history.value.add({
        id: "quadLinePath",
        isConnected: true,
      });
      currentItem.value = history.value.getLast();
    } else {
      linePoints.value = [];
    }
  }
  block1.isPaint = false;
};

const zoom = (event: KonvaEventObject<any>) => {
  event.evt.preventDefault();
  const scaleBy = 1.01;
  const stage = stageRef.value.getStage();
  var oldScale = stage.scaleX();
  var pointer = stage.getPointerPosition();

  var mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  // how to scale? Zoom in? Or zoom out?
  let direction = event.evt.deltaY > 0 ? -1 : 1;

  scale.value = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stage.scale({ x: scale.value, y: scale.value });

  var newPos = {
    x: pointer.x - mousePointTo.x * scale.value,
    y: pointer.y - mousePointTo.y * scale.value,
  };

  stage.position(newPos);
  updateLine(ActionE.ZOOM);
};

const updateLine = (actionType: ActionE = ActionE.DRAG) => {
  if (block1.isConnected) {
    let points: number[] = [];
    if (actionType === ActionE.DRAG || actionType === ActionE.ZOOM) {
      const stage = stageRef.value.getStage();

      const startCircle = stage.findOne("#startCircle").getAbsolutePosition();
      const endCircle = stage.findOne("#endCircle").getAbsolutePosition();

      points = getZoomedPoints(
        startCircle.x,
        startCircle.y,
        endCircle.x,
        endCircle.y
      );
    } else if (actionType === ActionE.UNDOREDO) {
      points = [
        block1.groupConfig.X + startCircleGroupPosition.x,
        block1.groupConfig.Y + startCircleGroupPosition.y,
        block2.groupConfig.X + endCircleGroupPosition.x,
        block2.groupConfig.Y + endCircleGroupPosition.y,
      ];
    }
    linePoints.value = curveLine(points[0], points[1], points[2], points[3]);
  } else if (!block1.isConnected && !block1.isPaint) {
    linePoints.value = [linePoints.value[0], linePoints.value[1]];
  } else {
    // nothing
  }
};

const getZoomedPoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Array<number> => {
  x1 = zoomNumberByX(x1);
  y1 = zoomNumberByY(y1);
  x2 = zoomNumberByX(x2);
  y2 = zoomNumberByY(y2);

  return [x1, y1, x2, y2];
};

const zoomNumberByX = (value: number): number => {
  const stage = stageRef.value.getStage();
  return (value - stage.x()) / scale.value;
};
const zoomNumberByY = (value: number): number => {
  const stage = stageRef.value.getStage();
  return (value - stage.y()) / scale.value;
};

const curveLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Array<number> => {
  const x1c = x1 + x1 / 20;
  const y1c = y1 - (y1 / 20) * (y1 > y2 ? 1 : -1);
  const x2c = x2 - x2 / 20;
  const y2c = y2 - (y2 / 20) * (y1 > y2 ? -1 : 1);
  return [x1, y1, x1c, y1c, x2c, y2c, x2, y2];
};

const undo = (): void => {
  let previous = currentItem.value?.prev;
  if (currentItem.value && previous) {
    let elementHasPreviosValue = true;
    //find previous value of element
    while (previous && currentItem.value.data.id !== previous?.data.id) {
      previous = previous?.prev;
      elementHasPreviosValue =
        elementHasPreviosValue ||
        previous?.data.id === currentItem.value.data.id;
    }
    // descrease currentItem
    currentItem.value = currentItem.value.prev;

    // if doesn't have previous value leave
    if (!elementHasPreviosValue) {
      return;
    }

    if (previous) {
      if (previous.data?.id === "block1") {
        //update group position
        block1.groupConfig.X = (previous.data as BlockT).x;
        block1.groupConfig.Y = (previous.data as BlockT).y;
      }
      if (previous.data?.id === "block2") {
        block2.groupConfig.X = (previous.data as BlockT).x;
        block2.groupConfig.Y = (previous.data as BlockT).y;
      }
      if (previous.data?.id === "quadLinePath") {
        block1.isConnected = (previous.data as LineT).isConnected;
      }
      updateLine(ActionE.UNDOREDO);
    }
  }
  console.log(currentItem.value);
  console.log(history.value);
};
const redo = (): void => {
  const next = currentItem.value?.next;
  if (next) {
    if (next.data?.id === "block1") {
      //update group position
      block1.groupConfig.X = (next.data as BlockT).x;
      block1.groupConfig.Y = (next.data as BlockT).y;
    }
    if (next.data?.id === "block2") {
      block2.groupConfig.X = (next.data as BlockT).x;
      block2.groupConfig.Y = (next.data as BlockT).y;
    }
    if (next.data?.id === "quadLinePath") {
      block1.isConnected = (next.data as LineT).isConnected;
    }
    currentItem.value = next;
    updateLine(ActionE.UNDOREDO);
  }
};
</script>

<template>
  <div class="main" @keydown.ctrl.z="undo">
    <div class="buttons">
      <button class="button" @click="undo">undo</button>
      <button class="button" @click="redo">redo</button>
    </div>
    <v-stage
      ref="stageRef"
      :config="block1.stageSize"
      @mousedown="startDraw"
      @mousemove="drawing"
      @mouseup="stopDraw"
      @wheel="zoom"
    >
      <v-layer>
        <v-group
          id="block1"
          :config="block1.groupConfig"
          :draggable="true"
          @mousedown="handleOnCircle"
          @dragmove="handleDrag"
          @dragend="handleDragend"
          :zIndex="1"
        >
          <v-rect :config="block1.rectConfig" />
          <v-text :config="block1.textConfig" :x="10" :y="10" />
          <v-circle
            id="startCircle"
            :config="block1.circleConfig"
            :zIndex="0"
          />
        </v-group>
        <v-line
          id="quadLinePath"
          :config="block1.lineConfig"
          :points="linePoints"
        />
        <v-group
          id="block2"
          :config="block2.groupConfig"
          :draggable="true"
          @mousedown="handleOnCircle"
          @dragmove="handleDrag($event)"
          @mousemove="handleDrag($event)"
          @dragend="handleDragend"
        >
          <v-rect :config="block2.rectConfig" />
          <v-text :config="block2.textConfig" :x="10" :y="10" />
          <v-circle id="endCircle" :config="block2.circleConfig" />
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>

<style>
.main {
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
}
.button {
  width: 200px;
  height: 80px;
  font-size: 50px;
}
</style>
