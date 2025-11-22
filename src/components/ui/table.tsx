import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Tipos
interface TableProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface TableContextType {
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
}

const TableContext = React.createContext<TableContextType>({});

// Componente Principal
function Table({
  children,
  style,
  variant = 'default',
  size = 'md',
  ...props
}: TableProps & TableContextType) {
  return (
    <TableContext.Provider value={{ variant, size }}>
      <View style={[styles.tableContainer, style]} {...props}>
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.table}>
            {children}
          </View>
        </ScrollView>
      </View>
    </TableContext.Provider>
  );
}

// Header Component
function TableHeader({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { variant } = React.useContext(TableContext);
  
  return (
    <View
      style={[
        styles.header,
        variant === 'bordered' && styles.headerBordered,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Body Component
function TableBody({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.body, style]} {...props}>
      {children}
    </View>
  );
}

// Footer Component
function TableFooter({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { variant } = React.useContext(TableContext);
  
  return (
    <View
      style={[
        styles.footer,
        variant === 'bordered' && styles.footerBordered,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Row Component
function TableRow({
  children,
  style,
  isSelected = false,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  isSelected?: boolean;
}) {
  const { variant } = React.useContext(TableContext);
  
  return (
    <View
      style={[
        styles.row,
        variant === 'bordered' && styles.rowBordered,
        isSelected && styles.rowSelected,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Head Cell Component
function TableHead({
  children,
  style,
  textStyle,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
}) {
  const { variant, size } = React.useContext(TableContext);
  
  return (
    <View
      style={[
        styles.headCell,
        variant === 'bordered' && styles.headCellBordered,
        size === 'sm' && styles.headCellSm,
        size === 'lg' && styles.headCellLg,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.headText, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

// Cell Component
function TableCell({
  children,
  style,
  textStyle,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
}) {
  const { variant, size } = React.useContext(TableContext);
  
  return (
    <View
      style={[
        styles.cell,
        variant === 'bordered' && styles.cellBordered,
        size === 'sm' && styles.cellSm,
        size === 'lg' && styles.cellLg,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.cellText, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

// Caption Component
function TableCaption({
  children,
  style,
  textStyle,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
}) {
  return (
    <View style={[styles.caption, style]} {...props}>
      <Text style={[styles.captionText, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  tableContainer: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    width: '100%',
  },
  table: {
    minWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBordered: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 1,
  },
  body: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerBordered: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowSelected: {
    backgroundColor: '#EFF6FF',
  },
  headCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  headCellBordered: {
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  headCellSm: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headCellLg: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'left',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  cellBordered: {
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  cellSm: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cellLg: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'left',
  },
  caption: {
    padding: 16,
    paddingTop: 8,
  },
  captionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

// Componentes especializados

// Tabela de dados com ações
interface DataTableProps<T> {
   data: T[];
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    render?: (item: T) => React.ReactNode;
  }>;
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowPress,
  variant = 'default',
  size = 'md',
}: DataTableProps<T>) {
  return (
    <Table variant={variant} size={size}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead 
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
            >
              {column.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {data.map((item) => (
          <TableRow 
            key={keyExtractor(item)}
            style={onRowPress ? { cursor: 'pointer' } : undefined}
            isSelected={false}
          >
            {columns.map((column) => (
              <TableCell 
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.render ? column.render(item) : (item as any)[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Tabela responsiva para mobile
function MobileTable<T>({
  data,
  columns,
  keyExtractor,
  renderCard,
}: {
  data: T[];
  columns: Array<{ key: string; title: string }>;
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
}) {
  // Em mobile, mostra cards em vez de tabela
  return (
    <View style={mobileStyles.mobileContainer}>
      {data.map((item) => (
        <View key={keyExtractor(item)} style={mobileStyles.mobileCard}>
          {renderCard(item)}
        </View>
      ))}
    </View>
  );
}

// Estilos para mobile
const mobileStyles = StyleSheet.create({
  mobileContainer: {
    gap: 12,
    padding: 16,
  },
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
});

// Combinar estilos
Object.assign(styles, mobileStyles);

// Hook para ordenação
function useTableSort<T>(data: T[], defaultSort?: { key: keyof T; direction: 'asc' | 'desc' }) {
  const [sortConfig, setSortConfig] = React.useState(defaultSort);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return undefined;
    });
  };

  return { sortedData, sortConfig, requestSort };
}

// Exportações
export {
  DataTable,
  MobileTable, Table, TableBody, TableCaption, TableCell, TableFooter,
  TableHead, TableHeader, TableRow, useTableSort
};

