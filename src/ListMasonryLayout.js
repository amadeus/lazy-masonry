import React, {createRef} from 'react';
import classNames from 'classnames';
import styles from './ListMasonryLayout.module.css';

function getMinColumn(columns): Array<[number, number]> {
  return columns.reduce((acc, height, column) => {
    if (acc == null || height < acc[0]) {
      return [height, column];
    }
    return acc;
  }, null);
}

type Coords = {
  position: 'absolute',
  top: number,
  left: number,
  width: number,
  height: number,
};

class ListComputer<Item> {
  _coordsMap: {[itemId: string]: Coords} = {};
  _columnHeights: Array<number> = [];
  _columnWidth: number;

  columns: number;
  gutterSize: number;
  getItemId: Item => string;
  getItemHeight: (item: Item, columnWidth: number) => number;

  constructor(
    columns: number,
    gutterSize: number,
    getItemId: Item => string,
    getItemHeight: (item: Item, columnWidth: number) => number
  ) {
    this.columns = columns;
    this.gutterSize = gutterSize;
    this.getItemId = getItemId;
    this.getItemHeight = getItemHeight;
  }

  computeFullCoords(data: Array<Item>, scrollY: number, scrollerHeight: number, scrollerWidth: number): Array<Item> {
    const {columns, getItemId, getItemHeight, gutterSize} = this;
    const coordsMap = {};
    const columnHeights = new Array(columns).fill(0);
    const columnWidth = (scrollerWidth - gutterSize * (columns - 1)) / columns;
    const visibleItems = [];

    data.forEach(item => {
      const id = getItemId(item);
      // Not sure we'd ever need something like this, but it could be fun
      if (id == null) {
        return;
      }

      const [columnHeight, columnIndex] = getMinColumn(columnHeights);
      const height = getItemHeight(item, columnWidth);
      const top = columnHeight + gutterSize;
      const coords = {
        position: 'absolute',
        left: columnWidth * columnIndex + gutterSize * columnIndex,
        width: columnWidth,
        top,
        height,
      };
      if (top > scrollY - height && top < scrollY + scrollerHeight) {
        visibleItems.push(item);
      }
      coordsMap[id] = coords;
      columnHeights[columnIndex] = top + height;
    });

    this._columnWidth = columnWidth;
    this._coordsMap = coordsMap;
    this._columnHeights = columnHeights.map(height => height + gutterSize);
    return visibleItems;
  }

  computerVisibleItems(data: Array<Item>, scrollY: number, scrollerHeight: number): Array<Item> {
    const {getItemId, _coordsMap} = this;
    const visibleItems = [];

    data.forEach(item => {
      const id = getItemId(item);
      if (id == null || _coordsMap[id] == null) {
        return;
      }
      const {top, height} = _coordsMap[id];
      if (top > scrollY - height && top < scrollY + scrollerHeight) {
        visibleItems.push(item);
      }
    });

    return visibleItems;
  }

  getCoords(id: string) {
    return this._coordsMap[id];
  }

  getTotalHeight() {
    return this._columnHeights.reduce((acc, height) => Math.max(acc, height), 0);
  }
}

const ListItem = ({style, children}) => <div style={style}>{children}</div>;

class ListMasonry extends React.Component {
  static defaultProps = {
    columns: 2,
    gutterSize: 10,
  };

  containerRef = createRef();

  state = {
    width: 0,
    height: 0,
    items: [],
  };

  constructor(props) {
    super(props);
    this.computer = new ListComputer(props.columns, props.gutterSize, props.getItemId, props.getItemHeight);
  }

  getScrollerData() {
    const {current} = this.containerRef;
    return current != null
      ? {
          width: current.offsetWidth,
          height: current.offsetHeight,
          scrollTop: current.scrollTop,
        }
      : {width: 0, height: 0, scrollTop: 0};
  }

  componentDidMount() {
    const {data} = this.props;
    const {scrollTop, height, width} = this.getScrollerData();
    const items = this.computer.computeFullCoords(data, scrollTop, height, width);
    this.setState({scrollTop, height, width, items});
  }

  handleScroll = () => {
    const {data} = this.props;
    const {scrollTop, height} = this.getScrollerData();
    const items = this.computer.computerVisibleItems(data, scrollTop, height);
    this.setState({scrollTop, height, items});
  };

  render() {
    const {
      props: {className, renderItem, getItemId},
      state: {items},
      computer,
    } = this;
    return (
      <div className={classNames(styles.wrap, className)}>
        <div className={styles.scroller} ref={this.containerRef} onScroll={this.handleScroll}>
          <div style={{height: computer.getTotalHeight()}} />
          {items.map(item => {
            const id = getItemId(item);
            const coords = computer.getCoords(id);
            return coords != null ? (
              <ListItem style={coords} key={id}>
                {renderItem(item, coords)}
              </ListItem>
            ) : null;
          })}
        </div>
      </div>
    );
  }
}

export default ListMasonry;
