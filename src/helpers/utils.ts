/* eslint-disable prettier/prettier */
class Item<T> {
  public data: T;
  public next: Item<T> | null;
  public prev: Item<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
    this.prev = null;
  }
}

class DoublyLinkedList<T> {
  private head: Item<T> | null;
  private tail: Item<T> | null;
  private size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public add(data: T): void {
    const item = new Item<T>(data);
    if (!this.head) {
      this.head = item;
      this.tail = item;
    } else {
      this.tail!.next = item;
      item.prev = this.tail;
      this.tail = item;
    }
    this.size++;
  }

  public addAfter(currentItem: Item<T>, data: T): void {
    const item = new Item<T>(data);
    item.next = currentItem.next;
    item.prev = currentItem;
    if (currentItem.next) {
      currentItem.next.prev = item;
    } else {
      this.tail = item;
    }
    currentItem.next = item;
    this.size++;

    // Remove subsequent items after the new item
    let next = item.next;
    while (next) {
      this.remove(next.data);
      next = next.next;
    }
  }

  public remove(data: T): void {
    let current = this.head;
    while (current) {
      if (current.data === data) {
        if (current === this.head && current === this.tail) {
          this.head = null;
          this.tail = null;
        } else if (current === this.head) {
          this.head = current.next;
          this.head!.prev = null;
        } else if (current === this.tail) {
          this.tail = current.prev;
          this.tail!.next = null;
        } else {
          current.prev!.next = current.next;
          current.next!.prev = current.prev;
        }
        this.size--;
      }
      current = current.next;
    }
  }

  public getSize(): number {
    return this.size;
  }

  public hasPrevious(item: Item<T>): boolean {
    return item.prev !== null;
  }

  public hasNext(item: Item<T>): boolean {
    return item.next !== null;
  }

  public getLast(): Item<T> | null {
    return this.tail;
  }
}

export { DoublyLinkedList };
