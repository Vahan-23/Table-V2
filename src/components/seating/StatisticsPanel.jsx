import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';

const StatisticsPanel = () => {
  const { state } = useSeating();
  const { t } = useTranslations();

  // Подсчет статистики
  const totalPeople = state.groups?.reduce((total, group) => total + (group.members?.length || 0), 0) || 0;
  const totalGroups = state.groups?.length || 0;
  
  // Подсчет всех людей в группах (включая тех, кто не рассажен)
  const allPeopleInGroups = state.groups?.reduce((total, group) => {
    return total + (group.members?.length || 0);
  }, 0) || 0;
  
  // Подсчет рассаженных людей
  const seatedPeople = state.hallData?.tables?.reduce((total, table) => {
    return total + (table.people?.filter(person => person).length || 0);
  }, 0) || 0;
  
  const unseatedPeople = allPeopleInGroups - seatedPeople;
  
  // Подсчет групп с рассаженными людьми (только полностью рассаженные)
  const groupsWithSeatedPeople = state.groups?.filter(group => {
    if (!group.members || group.members.length === 0) return false;
    
    // Подсчитываем сколько людей из группы рассажено
    const seatedPeopleFromGroup = state.hallData?.tables?.reduce((total, table) => {
      return total + (table.people?.filter(seatedPerson => 
        seatedPerson && seatedPerson.groupId === group.id
      ).length || 0);
    }, 0) || 0;
    
    // Группа считается "с рассаженными" только если ВСЕ люди из группы рассажены
    return seatedPeopleFromGroup >= group.members.length;
  }).length || 0;
  
  const groupsWithoutSeatedPeople = totalGroups - groupsWithSeatedPeople;

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e9ecef',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#495057',
        fontSize: '18px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📊 {t('statistics')}
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {/* Статистика по людям */}
        <div style={{
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #2196f3'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: '#1976d2',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            👥 {t('people')}
          </h4>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
             <span style={{ color: '#666', fontSize: '13px' }}>{t('allPeopleInGroups')}:</span>
             <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '16px' }}>{allPeopleInGroups}</span>
           </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('seatedPeople')}:</span>
            <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>{seatedPeople}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('unseatedPeople')}:</span>
            <span style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '16px' }}>{unseatedPeople}</span>
          </div>
        </div>

        {/* Статистика по группам */}
        <div style={{
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #4caf50'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: '#2e7d32',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🏷️ {t('groups')}
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('totalGroups')}:</span>
            <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>{totalGroups}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('groupsWithSeated')}:</span>
            <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>{groupsWithSeatedPeople}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('groupsWithoutSeated')}:</span>
            <span style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '16px' }}>{groupsWithoutSeatedPeople}</span>
          </div>
        </div>

        {/* Процент заполнения */}
        <div style={{
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #ff9800'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: '#f57c00',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📈 {t('occupancy')}
          </h4>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
             <span style={{ color: '#666', fontSize: '13px' }}>{t('seatingRate')}:</span>
             <span style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '16px' }}>
               {allPeopleInGroups > 0 ? Math.round((seatedPeople / allPeopleInGroups) * 100) : 0}%
             </span>
           </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>{t('groupSeatingRate')}:</span>
            <span style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '16px' }}>
              {totalGroups > 0 ? Math.round((groupsWithSeatedPeople / totalGroups) * 100) : 0}%
            </span>
          </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span style={{ color: '#666', fontSize: '13px' }}>{t('averageGroupSize')}:</span>
             <span style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '16px' }}>
               {totalGroups > 0 ? Math.round(allPeopleInGroups / totalGroups) : 0}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel; 