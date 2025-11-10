export class ReportGenerator {
  constructor(database) {
    this.db = database;
    this.PERMISSION_THRESHOLD = 500;
    this.formatters = {
      CSV: new CSVFormatter(),
      HTML: new HTMLFormatter()
    };
  }

  generateReport(reportType, user, items) {
    const formatter = this.formatters[reportType];
    const filteredItems = this.filterItemsByUserRole(items, user);
    const processedItems = this.processItems(filteredItems, user);
    const total = this.calculateTotal(processedItems);

    return formatter.generateReport(processedItems, user, total);
  }

  filterItemsByUserRole(items, user) {
    if (user.role === 'ADMIN') {
      return items;
    }
    return items.filter(item => item.value <= this.PERMISSION_THRESHOLD);
  }

  processItems(items, user) {
    if (user.role === 'ADMIN') {
      return items.map(item => ({
        ...item,
        priority: item.value > 1000
      }));
    }
    return items;
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}

class ReportFormatter {
  generateHeader() {
    throw new Error('Subclass must implement generateHeader');
  }

  generateBody(items, user) {
    throw new Error('Subclass must implement generateBody');
  }

  generateFooter(total) {
    throw new Error('Subclass must implement generateFooter');
  }

  generateReport(items, user, total) {
    const report = [
      this.generateHeader(user),
      this.generateBody(items, user),
      this.generateFooter(total)
    ].join('');

    return report.trim();
  }
}

class CSVFormatter extends ReportFormatter {
  generateHeader() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  generateBody(items, user) {
    return items
      .map(item => `${item.id},${item.name},${item.value},${user.name}\n`)
      .join('');
  }

  generateFooter(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HTMLFormatter extends ReportFormatter {
  generateHeader(user) {
    return [
      '<html><body>\n',
      '<h1>Relatório</h1>\n',
      `<h2>Usuário: ${user.name}</h2>\n`,
      '<table>\n',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    ].join('');
  }

  generateBody(items) {
    return items
      .map(item => {
        const style = item.priority ? 'style="font-weight:bold;"' : '';
        return `<tr${style ? ' ' + style : ''}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
      })
      .join('');
  }

  generateFooter(total) {
    return [
      '</table>\n',
      `<h3>Total: ${total}</h3>\n`,
      '</body></html>\n'
    ].join('');
  }
}