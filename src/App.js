import React, {Component} from 'react';
import List from './ListMasonryLayout';
import Cats from './Cats';
import styles from './App.module.css';

class App extends Component {
  renderItem(item, coords) {
    return <img alt="" src={item.src} className={styles.image} />;
  }

  getHeight({width, height}, columnWidth) {
    const ratio = height / width;
    return columnWidth * ratio;
  }

  getId(item) {
    return item.src;
  }

  render() {
    return (
      <div className={styles.container}>
        <List
          className={styles.scroller}
          gutterSize={10}
          columns={4}
          data={Cats}
          getItemId={this.getId}
          getItemHeight={this.getHeight}
          renderItem={this.renderItem}
        />
      </div>
    );
  }
}

export default App;
